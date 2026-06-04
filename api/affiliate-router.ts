import { z } from "zod";
import { eq, and, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createRouter, authedQuery, adminQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { affiliates, affiliateClicks, affiliateCommissions, affiliatePayouts, users } from "@db/schema";
import { Errors } from "@contracts/errors";

export const affiliateRouter = createRouter({
  // ── register as affiliate ──
  register: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const existing = await db.query.affiliates.findFirst({
      where: eq(affiliates.userId, ctx.user!.id),
    });
    if (existing) throw Errors.badRequest("Du bist bereits als Affiliate registriert.");

    const referralCode = nanoid(10).toUpperCase();
    await db.insert(affiliates).values({
      userId: ctx.user!.id,
      referralCode,
      commissionRate: "10.00",
      status: "active",
    });

    return { success: true, referralCode };
  }),

  // ── get my affiliate info ──
  myInfo: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const affiliate = await db.query.affiliates.findFirst({
      where: eq(affiliates.userId, ctx.user!.id),
      with: {
        commissions: { orderBy: (c, { desc }) => [desc(c.createdAt)], limit: 10 },
        payouts: { orderBy: (p, { desc }) => [desc(p.createdAt)], limit: 5 },
      },
    });
    return affiliate ?? null;
  }),

  // ── my stats ──
  myStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const affiliate = await db.query.affiliates.findFirst({
      where: eq(affiliates.userId, ctx.user!.id),
    });
    if (!affiliate) return null;

    const clicks = await db.select({ count: sql<number>`count(*)` })
      .from(affiliateClicks)
      .where(eq(affiliateClicks.affiliateId, affiliate.id));

    const conversions = await db.select({ count: sql<number>`count(*)` })
      .from(affiliateClicks)
      .where(and(eq(affiliateClicks.affiliateId, affiliate.id), eq(affiliateClicks.converted, true)));

    const pendingCommissions = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(affiliateCommissions)
      .where(and(eq(affiliateCommissions.affiliateId, affiliate.id), eq(affiliateCommissions.status, "pending")));

    return {
      totalClicks: Number(clicks[0]?.count ?? 0),
      totalConversions: Number(conversions[0]?.count ?? 0),
      conversionRate: clicks[0]?.count ? (Number(conversions[0]?.count ?? 0) / Number(clicks[0].count) * 100).toFixed(1) : "0",
      totalEarned: affiliate.totalEarned,
      pendingPayout: affiliate.pendingPayout,
      totalPaidOut: affiliate.totalPaidOut,
      pendingCommissions: parseFloat(pendingCommissions[0]?.total ?? "0"),
      referralCode: affiliate.referralCode,
    };
  }),

  // ── track click (public) ──
  trackClick: publicQuery
    .input(z.object({
      referralCode: z.string(),
      landingPage: z.string().optional(),
      referrer: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const affiliate = await db.query.affiliates.findFirst({
        where: and(eq(affiliates.referralCode, input.referralCode), eq(affiliates.status, "active")),
      });
      if (!affiliate) return { success: false };

      const ipAddress = ctx.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
      const userAgent = ctx.req.headers.get("user-agent") ?? "";

      await db.insert(affiliateClicks).values({
        affiliateId: affiliate.id,
        ipAddress,
        userAgent,
        referrer: input.referrer,
        landingPage: input.landingPage,
        converted: false,
      });

      return { success: true };
    }),

  // ── my commissions ──
  myCommissions: authedQuery
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const affiliate = await db.query.affiliates.findFirst({ where: eq(affiliates.userId, ctx.user!.id) });
      if (!affiliate) return { items: [], total: 0 };

      const offset = (input.page - 1) * input.limit;
      const items = await db.query.affiliateCommissions.findMany({
        where: eq(affiliateCommissions.affiliateId, affiliate.id),
        with: { order: true },
        orderBy: (c, { desc }) => [desc(c.createdAt)],
        limit: input.limit,
        offset,
      });

      return { items, total: items.length };
    }),

  // ── request payout ──
  requestPayout: authedQuery
    .input(z.object({
      method: z.enum(["paypal", "bank", "crypto"]),
      details: z.record(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const affiliate = await db.query.affiliates.findFirst({ where: eq(affiliates.userId, ctx.user!.id) });
      if (!affiliate) throw Errors.notFound("Kein Affiliate-Konto gefunden.");

      const pending = parseFloat(affiliate.pendingPayout ?? "0");
      if (pending < 10) throw Errors.badRequest("Mindestbetrag für Auszahlung ist 10 €.");

      await db.insert(affiliatePayouts).values({
        affiliateId: affiliate.id,
        amount: affiliate.pendingPayout,
        method: input.method,
        status: "pending",
        notes: JSON.stringify(input.details),
      });

      await db.update(affiliates).set({ pendingPayout: "0" }).where(eq(affiliates.id, affiliate.id));

      return { success: true };
    }),

  // ── admin: list all affiliates ──
  adminList: adminQuery.query(async () => {
    const db = getDb();
    return db.query.affiliates.findMany({
      with: { user: true },
      orderBy: (a, { desc }) => [desc(a.totalEarned)],
    });
  }),

  // ── admin: approve payout ──
  adminApprovePayout: adminQuery
    .input(z.object({ payoutId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const payout = await db.query.affiliatePayouts.findFirst({ where: eq(affiliatePayouts.id, input.payoutId) });
      if (!payout) throw Errors.notFound("Auszahlung nicht gefunden.");

      await db.update(affiliatePayouts).set({ status: "completed" }).where(eq(affiliatePayouts.id, input.payoutId));

      // Update affiliate totals
      await db.update(affiliates).set({
        totalPaidOut: sql`total_paid_out + ${payout.amount}`,
      }).where(eq(affiliates.id, payout.affiliateId));

      return { success: true };
    }),
});
