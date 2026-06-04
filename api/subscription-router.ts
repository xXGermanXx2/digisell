import { z } from "zod";
import { eq, and, desc, sql, lte } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  subscriptions,
  products,
  users,
  shops,
  platformSubscriptions,
  subscriptionAuditLogs,
} from "@db/schema";
import { Errors } from "@contracts/errors";

// ===================== PLAN LIMITS =====================
export const PLAN_LIMITS = {
  free:       { shopLimit: 1,   productLimit: 10,  storageLimit: 500 },
  premium:    { shopLimit: 5,   productLimit: 100, storageLimit: 5000 },
  business:   { shopLimit: 20,  productLimit: 500, storageLimit: 20000 },
  enterprise: { shopLimit: -1,  productLimit: -1,  storageLimit: -1 },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;

export const subscriptionRouter = createRouter({

  // ── Meine Produkt-Abos ────────────────────────────────────────────────────
  myList: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.subscriptions.findMany({
      where: eq(subscriptions.customerId, ctx.user!.id),
      with: { product: true },
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });
  }),

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
      if (sub.status === "expired") throw Errors.badRequest("Abonnement ist abgelaufen.");

      await db.update(subscriptions).set({
        status: "active",
        cancelAtPeriodEnd: false,
        cancelledAt: null,
      }).where(eq(subscriptions.id, sub.id));

      return { success: true };
    }),

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
      return db.query.subscriptions.findMany({
        where,
        with: { customer: true, product: true },
        orderBy: (s, { desc }) => [desc(s.createdAt)],
        limit: input.limit,
        offset,
      });
    }),

  processRenewals: adminQuery.mutation(async () => {
    const db = getDb();
    const now = new Date();
    const due = await db.query.subscriptions.findMany({
      where: and(eq(subscriptions.status, "active"), lte(subscriptions.currentPeriodEnd, now)),
      with: { product: true, customer: true },
    });
    const results = [];
    for (const sub of due) {
      if (sub.cancelAtPeriodEnd) {
        await db.update(subscriptions).set({ status: "cancelled" }).where(eq(subscriptions.id, sub.id));
        results.push({ id: sub.id, action: "cancelled" });
        continue;
      }
      let days = 30;
      if (sub.interval === "yearly") days = 365;
      else if (sub.interval === "custom" && sub.intervalDays) days = sub.intervalDays;
      const newStart = new Date(sub.currentPeriodEnd);
      const newEnd = new Date(newStart.getTime() + days * 24 * 60 * 60 * 1000);
      await db.update(subscriptions).set({ currentPeriodStart: newStart, currentPeriodEnd: newEnd, status: "active" }).where(eq(subscriptions.id, sub.id));
      results.push({ id: sub.id, action: "renewed", nextEnd: newEnd });
    }
    return { processed: results.length, results };
  }),

  // ── Platform-Plan (Seller-Abo) ────────────────────────────────────────────

  /** Eigenen Tarif + Limits abrufen */
  getMyPlan: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [user] = await db
      .select({
        subscriptionPlan: users.subscriptionPlan,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionExpiresAt: users.subscriptionExpiresAt,
        shopLimit: users.shopLimit,
        productLimit: users.productLimit,
        storageLimit: users.storageLimit,
        isLifetimePremium: users.isLifetimePremium,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user) throw new Error("Nutzer nicht gefunden.");

    const [shopCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(shops)
      .where(eq(shops.ownerId, ctx.user.id));

    const [productCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.sellerId, ctx.user.id));

    const isExpired =
      !user.isLifetimePremium &&
      user.subscriptionExpiresAt !== null &&
      new Date(user.subscriptionExpiresAt) < new Date();

    const effectivePlan = isExpired ? "free" : (user.subscriptionPlan ?? "free");
    const effectiveShopLimit = isExpired ? 1 : user.shopLimit;
    const effectiveProductLimit = isExpired ? 10 : user.productLimit;

    return {
      plan: effectivePlan,
      status: isExpired ? "expired" : (user.subscriptionStatus ?? "none"),
      expiresAt: user.subscriptionExpiresAt,
      shopLimit: effectiveShopLimit,
      productLimit: effectiveProductLimit,
      storageLimit: user.storageLimit,
      isLifetimePremium: user.isLifetimePremium,
      currentShops: Number(shopCount?.count ?? 0),
      currentProducts: Number(productCount?.count ?? 0),
      canCreateShop: effectiveShopLimit === -1 || Number(shopCount?.count ?? 0) < effectiveShopLimit,
      canCreateProduct: effectiveProductLimit === -1 || Number(productCount?.count ?? 0) < effectiveProductLimit,
    };
  }),

  /** Nutzer-Liste mit Abo-Info (Admin) */
  adminGetUsers: adminQuery
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
      search: z.string().optional(),
      plan: z.enum(["free", "premium", "business", "enterprise"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
          subscriptionPlan: users.subscriptionPlan,
          subscriptionStatus: users.subscriptionStatus,
          subscriptionExpiresAt: users.subscriptionExpiresAt,
          shopLimit: users.shopLimit,
          productLimit: users.productLimit,
          storageLimit: users.storageLimit,
          isLifetimePremium: users.isLifetimePremium,
          createdAt: users.createdAt,
        })
        .from(users)
        .limit(input.limit)
        .offset(offset)
        .orderBy(desc(users.createdAt));

      const userIds = rows.map((r) => r.id);
      let shopCountMap: Record<number, number> = {};
      if (userIds.length > 0) {
        const shopCounts = await db
          .select({ ownerId: shops.ownerId, count: sql<number>`count(*)` })
          .from(shops)
          .where(sql`owner_id IN (${sql.join(userIds.map((id) => sql`${id}`), sql`, `)})`)
          .groupBy(shops.ownerId);
        shopCountMap = Object.fromEntries(shopCounts.map((s) => [s.ownerId, Number(s.count)]));
      }

      const [total] = await db.select({ count: sql<number>`count(*)` }).from(users);

      return {
        items: rows.map((r) => ({ ...r, shopCount: shopCountMap[r.id] ?? 0 })),
        total: Number(total?.count ?? 0),
        page: input.page,
        limit: input.limit,
      };
    }),

  /** Tarif setzen (Admin) */
  adminSetPlan: adminQuery
    .input(z.object({
      userId: z.number().int().positive(),
      plan: z.enum(["free", "premium", "business", "enterprise"]),
      expiresAt: z.string().optional(),
      isLifetimePremium: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [oldUser] = await db
        .select({
          subscriptionPlan: users.subscriptionPlan,
          subscriptionStatus: users.subscriptionStatus,
          shopLimit: users.shopLimit,
          productLimit: users.productLimit,
          isLifetimePremium: users.isLifetimePremium,
        })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!oldUser) throw new Error("Nutzer nicht gefunden.");

      const limits = PLAN_LIMITS[input.plan];
      const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
      const isLifetime = input.isLifetimePremium ?? false;

      await db.update(users).set({
        subscriptionPlan: input.plan,
        subscriptionStatus: "active",
        subscriptionExpiresAt: isLifetime ? null : expiresAt,
        shopLimit: limits.shopLimit,
        productLimit: limits.productLimit,
        storageLimit: limits.storageLimit,
        isLifetimePremium: isLifetime,
      }).where(eq(users.id, input.userId));

      await db.insert(platformSubscriptions).values({
        userId: input.userId,
        planName: input.plan,
        status: "active",
        expiresAt: isLifetime ? null : expiresAt,
        grantedByAdminId: ctx.user.id,
        notes: input.notes ?? null,
      });

      await db.insert(subscriptionAuditLogs).values({
        adminId: ctx.user.id,
        userId: input.userId,
        action: "plan_changed",
        oldValues: { plan: oldUser.subscriptionPlan, shopLimit: oldUser.shopLimit, productLimit: oldUser.productLimit, isLifetimePremium: oldUser.isLifetimePremium },
        newValues: { plan: input.plan, shopLimit: limits.shopLimit, productLimit: limits.productLimit, isLifetimePremium: isLifetime, expiresAt: expiresAt?.toISOString() },
      });

      return { success: true };
    }),

  /** Individuelle Limits setzen (Admin) */
  adminSetLimits: adminQuery
    .input(z.object({
      userId: z.number().int().positive(),
      shopLimit: z.number().int().min(-1).optional(),
      productLimit: z.number().int().min(-1).optional(),
      storageLimit: z.number().int().min(-1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [oldUser] = await db
        .select({ shopLimit: users.shopLimit, productLimit: users.productLimit, storageLimit: users.storageLimit })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!oldUser) throw new Error("Nutzer nicht gefunden.");

      const updateData: Record<string, number> = {};
      if (input.shopLimit !== undefined) updateData.shopLimit = input.shopLimit;
      if (input.productLimit !== undefined) updateData.productLimit = input.productLimit;
      if (input.storageLimit !== undefined) updateData.storageLimit = input.storageLimit;

      await db.update(users).set(updateData).where(eq(users.id, input.userId));

      await db.insert(subscriptionAuditLogs).values({
        adminId: ctx.user.id,
        userId: input.userId,
        action: "limits_changed",
        oldValues: { shopLimit: oldUser.shopLimit, productLimit: oldUser.productLimit, storageLimit: oldUser.storageLimit },
        newValues: updateData,
      });

      return { success: true };
    }),

  /** Premium entziehen (Admin) */
  adminRevokePremium: adminQuery
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [oldUser] = await db
        .select({ subscriptionPlan: users.subscriptionPlan })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      await db.update(users).set({
        subscriptionPlan: "free",
        subscriptionStatus: "cancelled",
        subscriptionExpiresAt: null,
        shopLimit: 1,
        productLimit: 10,
        storageLimit: 500,
        isLifetimePremium: false,
      }).where(eq(users.id, input.userId));

      await db.update(platformSubscriptions)
        .set({ status: "cancelled" })
        .where(and(eq(platformSubscriptions.userId, input.userId), eq(platformSubscriptions.status, "active")));

      await db.insert(subscriptionAuditLogs).values({
        adminId: ctx.user.id,
        userId: input.userId,
        action: "premium_revoked",
        oldValues: { plan: oldUser?.subscriptionPlan },
        newValues: { plan: "free", status: "cancelled" },
      });

      return { success: true };
    }),

  /** Audit-Logs abrufen (Admin) */
  adminGetAuditLogs: adminQuery
    .input(z.object({
      userId: z.number().int().positive().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions = input.userId ? [eq(subscriptionAuditLogs.userId, input.userId)] : [];

      const [rows, total] = await Promise.all([
        db.select().from(subscriptionAuditLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(subscriptionAuditLogs.createdAt))
          .limit(input.limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(subscriptionAuditLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined),
      ]);

      return { items: rows, total: Number(total[0]?.count ?? 0), page: input.page, limit: input.limit };
    }),

  /** Abo-Historie eines Nutzers (Admin) */
  adminGetUserSubscriptions: adminQuery
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(platformSubscriptions)
        .where(eq(platformSubscriptions.userId, input.userId))
        .orderBy(desc(platformSubscriptions.createdAt));
    }),
});
