import { z } from "zod";
import { eq, and, lt, lte } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { subscriptions, products, users } from "@db/schema";
import { Errors } from "@contracts/errors";

export const subscriptionRouter = createRouter({
  // ── my subscriptions ──
  myList: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.subscriptions.findMany({
      where: eq(subscriptions.customerId, ctx.user!.id),
      with: { product: true },
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });
  }),

  // ── get single subscription ──
  get: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const sub = await db.query.subscriptions.findFirst({
        where: and(eq(subscriptions.id, input.id), eq(subscriptions.customerId, ctx.user!.id)),
        with: { product: true, order: true },
      });
      if (!sub) throw Errors.notFound("Abonnement nicht gefunden.");
      return sub;
    }),

  // ── cancel subscription ──
  cancel: authedQuery
    .input(z.object({
      id: z.number().int().positive(),
      immediately: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const sub = await db.query.subscriptions.findFirst({
        where: and(eq(subscriptions.id, input.id), eq(subscriptions.customerId, ctx.user!.id)),
      });
      if (!sub) throw Errors.notFound("Abonnement nicht gefunden.");
      if (sub.status === "cancelled") throw Errors.badRequest("Abonnement ist bereits gekündigt.");

      if (input.immediately) {
        await db.update(subscriptions).set({
          status: "cancelled",
          cancelledAt: new Date(),
          cancelAtPeriodEnd: false,
        }).where(eq(subscriptions.id, sub.id));
      } else {
        await db.update(subscriptions).set({
          cancelAtPeriodEnd: true,
          cancelledAt: new Date(),
        }).where(eq(subscriptions.id, sub.id));
      }

      return { success: true, cancelledImmediately: input.immediately };
    }),

  // ── reactivate subscription ──
  reactivate: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const sub = await db.query.subscriptions.findFirst({
        where: and(eq(subscriptions.id, input.id), eq(subscriptions.customerId, ctx.user!.id)),
      });
      if (!sub) throw Errors.notFound("Abonnement nicht gefunden.");
      if (sub.status !== "cancelled" && !sub.cancelAtPeriodEnd) {
        throw Errors.badRequest("Abonnement ist nicht gekündigt.");
      }
      if (sub.status === "expired") throw Errors.badRequest("Abonnement ist abgelaufen und kann nicht reaktiviert werden.");

      await db.update(subscriptions).set({
        status: "active",
        cancelAtPeriodEnd: false,
        cancelledAt: null,
      }).where(eq(subscriptions.id, sub.id));

      return { success: true };
    }),

  // ── admin: list all subscriptions ──
  adminList: adminQuery
    .input(z.object({
      status: z.enum(["active", "cancelled", "expired", "past_due", "trialing"]).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const where = input.status ? eq(subscriptions.status, input.status) : undefined;

      const items = await db.query.subscriptions.findMany({
        where,
        with: { customer: true, product: true },
        orderBy: (s, { desc }) => [desc(s.createdAt)],
        limit: input.limit,
        offset,
      });

      return items;
    }),

  // ── admin: process renewals (called by cron) ──
  processRenewals: adminQuery.mutation(async () => {
    const db = getDb();
    const now = new Date();

    // Find subscriptions due for renewal
    const due = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, "active"),
        lte(subscriptions.currentPeriodEnd, now),
      ),
      with: { product: true, customer: true },
    });

    const results = [];
    for (const sub of due) {
      if (sub.cancelAtPeriodEnd) {
        await db.update(subscriptions).set({ status: "cancelled" }).where(eq(subscriptions.id, sub.id));
        results.push({ id: sub.id, action: "cancelled" });
        continue;
      }

      // Calculate next period
      let days = 30;
      if (sub.interval === "yearly") days = 365;
      else if (sub.interval === "custom" && sub.intervalDays) days = sub.intervalDays;

      const newStart = new Date(sub.currentPeriodEnd);
      const newEnd = new Date(newStart.getTime() + days * 24 * 60 * 60 * 1000);

      await db.update(subscriptions).set({
        currentPeriodStart: newStart,
        currentPeriodEnd: newEnd,
        status: "active",
      }).where(eq(subscriptions.id, sub.id));

      results.push({ id: sub.id, action: "renewed", nextEnd: newEnd });
    }

    return { processed: results.length, results };
  }),
});
