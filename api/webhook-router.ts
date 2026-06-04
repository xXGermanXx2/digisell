import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createHmac } from "crypto";
import { nanoid } from "nanoid";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { webhooks, webhookLogs } from "@db/schema";
import { Errors } from "@contracts/errors";

export const WEBHOOK_EVENTS = [
  "order.created",
  "order.paid",
  "order.completed",
  "order.cancelled",
  "order.refunded",
  "subscription.created",
  "subscription.renewed",
  "subscription.cancelled",
  "subscription.expired",
  "ticket.created",
  "ticket.replied",
  "ticket.closed",
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number];

export async function triggerWebhook(event: WebhookEvent, payload: Record<string, unknown>, userId?: number) {
  const db = getDb();
  const hooks = await db.query.webhooks.findMany({
    where: eq(webhooks.isActive, true),
  });

  for (const hook of hooks) {
    const events = hook.events as string[];
    if (!events.includes(event) && !events.includes("*")) continue;

    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const signature = hook.secret
      ? createHmac("sha256", hook.secret).update(body).digest("hex")
      : undefined;

    const start = Date.now();
    let success = false;
    let responseStatus: number | undefined;
    let responseBody: string | undefined;
    let errorMessage: string | undefined;

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-DigiSell-Event": event,
        "X-DigiSell-Delivery": nanoid(),
      };
      if (signature) headers["X-DigiSell-Signature"] = `sha256=${signature}`;

      const res = await fetch(hook.url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(10000),
      });

      responseStatus = res.status;
      responseBody = await res.text().catch(() => "");
      success = res.ok;
    } catch (err: any) {
      errorMessage = err.message;
    }

    const duration = Date.now() - start;

    await db.insert(webhookLogs).values({
      webhookId: hook.id,
      event,
      payload: { event, payload },
      responseStatus,
      responseBody: responseBody?.substring(0, 2000),
      duration,
      success,
    });

    await db.update(webhooks).set({
      lastTriggeredAt: new Date(),
      failureCount: success ? 0 : (hook.failureCount ?? 0) + 1,
    }).where(eq(webhooks.id, hook.id));
  }
}

export const webhookRouter = createRouter({
  // ── list my webhooks ──
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.webhooks.findMany({
      where: eq(webhooks.userId, ctx.user!.id),
      orderBy: (w, { desc }) => [desc(w.createdAt)],
    });
  }),

  // ── create webhook ──
  create: authedQuery
    .input(z.object({
      name: z.string().min(1).max(255),
      url: z.string().url().max(500),
      events: z.array(z.string()).min(1),
      secret: z.string().max(255).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const result = await db.insert(webhooks).values({
        userId: ctx.user!.id,
        name: input.name,
        url: input.url,
        events: input.events,
        secret: input.secret ?? nanoid(32),
        isActive: true,
      });
      return { id: Number(result[0].insertId) };
    }),

  // ── update webhook ──
  update: authedQuery
    .input(z.object({
      id: z.number().int().positive(),
      name: z.string().min(1).max(255).optional(),
      url: z.string().url().max(500).optional(),
      events: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(webhooks).set(data)
        .where(and(eq(webhooks.id, id), eq(webhooks.userId, ctx.user!.id)));
      return { success: true };
    }),

  // ── delete webhook ──
  delete: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.delete(webhooks)
        .where(and(eq(webhooks.id, input.id), eq(webhooks.userId, ctx.user!.id)));
      return { success: true };
    }),

  // ── webhook logs ──
  logs: authedQuery
    .input(z.object({
      webhookId: z.number().int().positive(),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const hook = await db.query.webhooks.findFirst({
        where: and(eq(webhooks.id, input.webhookId), eq(webhooks.userId, ctx.user!.id)),
      });
      if (!hook) throw Errors.notFound("Webhook nicht gefunden.");

      return db.query.webhookLogs.findMany({
        where: eq(webhookLogs.webhookId, input.webhookId),
        orderBy: (l, { desc }) => [desc(l.createdAt)],
        limit: input.limit,
      });
    }),

  // ── available events ──
  events: authedQuery.query(() => WEBHOOK_EVENTS),
});
