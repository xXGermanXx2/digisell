import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createHash } from "crypto";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, apiKeys, orders, loginLogs, userWarnings } from "@db/schema";
import { Errors } from "@contracts/errors";
import { sendEmail, emailVerificationTemplate } from "./lib/email";
import { env } from "./lib/env";

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export const profileRouter = createRouter({
  // ── get profile ──
  get: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const user = await db.query.users.findFirst({ where: eq(users.id, ctx.user!.id) });
    if (!user) throw Errors.notFound("Benutzer nicht gefunden.");
    const { passwordHash, twoFactorSecret, emailVerifyToken, passwordResetToken, ...safe } = user;
    return safe;
  }),

  // ── update profile ──
  update: authedQuery
    .input(z.object({
      name: z.string().min(2).max(100).optional(),
      bio: z.string().max(500).optional(),
      website: z.string().url().max(500).optional().or(z.literal("")),
      phone: z.string().max(50).optional(),
      country: z.string().length(2).optional(),
      timezone: z.string().max(100).optional(),
      language: z.string().max(10).optional(),
      avatar: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(users).set({ ...input, updatedAt: new Date() }).where(eq(users.id, ctx.user!.id));
      return { success: true };
    }),

  // ── change password ──
  changePassword: authedQuery
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8).max(128),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({ where: eq(users.id, ctx.user!.id) });
      if (!user) throw Errors.notFound("Benutzer nicht gefunden.");

      if (user.passwordHash) {
        const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!valid) throw Errors.badRequest("Aktuelles Passwort ist falsch.");
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
      return { success: true };
    }),

  // ── request email change ──
  requestEmailChange: authedQuery
    .input(z.object({ newEmail: z.string().email().max(320) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const existing = await db.query.users.findFirst({ where: eq(users.email, input.newEmail) });
      if (existing) throw Errors.badRequest("Diese E-Mail ist bereits vergeben.");

      const token = Array.from({ length: 64 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]).join("");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.update(users).set({
        emailVerifyToken: `email_change:${input.newEmail}:${token}`,
        emailVerifyExpires: expires,
      }).where(eq(users.id, ctx.user!.id));

      await sendEmail({
        to: input.newEmail,
        subject: "Neue E-Mail bestätigen – DigiSell",
        html: emailVerificationTemplate(ctx.user!.name ?? "", token, env.appUrl),
      });

      return { success: true };
    }),

  // ── user warnings ──
  listWarnings: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.userWarnings.findMany({
      where: eq(userWarnings.userId, ctx.user!.id),
      orderBy: [desc(userWarnings.createdAt)],
      limit: 100,
    });
  }),
  listUndismissedWarnings: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.userWarnings.findMany({
      where: and(eq(userWarnings.userId, ctx.user!.id), eq(userWarnings.isDismissed, false)),
      orderBy: [desc(userWarnings.createdAt)],
      limit: 10,
    });
  }),
  dismissWarning: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(userWarnings).set({ isDismissed: true, dismissedAt: new Date() })
        .where(and(eq(userWarnings.id, input.id), eq(userWarnings.userId, ctx.user!.id)));
      return { success: true };
    }),

  // ── update notifications ──
  updateNotifications: authedQuery
    .input(z.object({
      notifyEmail: z.boolean().optional(),
      notifyOrderEmail: z.boolean().optional(),
      notifyTicketEmail: z.boolean().optional(),
      notifyNewsletterEmail: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(users).set(input).where(eq(users.id, ctx.user!.id));
      return { success: true };
    }),

  // ── order history with invoices ──
  orderHistory: authedQuery
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(10),
    }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const userOrders = await db.query.orders.findMany({
        where: eq(orders.customerId, ctx.user!.id),
        with: { items: true },
        orderBy: (o, { desc }) => [desc(o.createdAt)],
        limit: input.limit,
        offset,
      });
      return userOrders;
    }),

  // ── API Keys ──
  listApiKeys: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, ctx.user!.id),
      orderBy: (k, { desc }) => [desc(k.createdAt)],
    });
  }),

  createApiKey: authedQuery
    .input(z.object({
      name: z.string().min(1).max(255),
      permissions: z.array(z.string()).default([]),
      expiresAt: z.string().datetime().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const rawKey = `ds_${nanoid(40)}`;
      const keyHash = hashApiKey(rawKey);
      const keyPrefix = rawKey.substring(0, 10);

      await db.insert(apiKeys).values({
        userId: ctx.user!.id,
        name: input.name,
        keyHash,
        keyPrefix,
        permissions: input.permissions,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        isActive: true,
      });

      // Return full key only once
      return { key: rawKey, keyPrefix, name: input.name };
    }),

  revokeApiKey: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(apiKeys)
        .set({ isActive: false })
        .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, ctx.user!.id)));
      return { success: true };
    }),

  deleteApiKey: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.delete(apiKeys)
        .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, ctx.user!.id)));
      return { success: true };
    }),

  // ── Login History ──
  loginHistory: authedQuery
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const offset = (page - 1) * limit;
      const items = await db.query.loginLogs.findMany({
        where: eq(loginLogs.userId, ctx.user!.id),
        orderBy: [desc(loginLogs.createdAt)],
        limit,
        offset,
      });
      return { items, page };
    }),
});
