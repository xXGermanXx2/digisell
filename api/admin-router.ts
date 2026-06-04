import { z } from "zod";
import { eq, like, or, desc, sql, and, gte } from "drizzle-orm";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, systemLogs, orders, paymentLogs, visitorStats, affiliates } from "@db/schema";
import { Errors } from "@contracts/errors";

export const adminRouter = createRouter({
  // ── users: list ──
  listUsers: adminQuery
    .input(z.object({
      search: z.string().optional(),
      role: z.enum(["admin", "seller", "customer"]).optional(),
      status: z.enum(["active", "blocked", "pending"]).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const conditions = [];
      if (input.search) {
        conditions.push(
          or(
            like(users.name, `%${input.search}%`),
            like(users.email, `%${input.search}%`),
          )
        );
      }
      if (input.role) conditions.push(eq(users.role, input.role));
      if (input.status) conditions.push(eq(users.status, input.status));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        db.query.users.findMany({
          where,
          orderBy: (u, { desc }) => [desc(u.createdAt)],
          limit: input.limit,
          offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(users).where(where),
      ]);

      return {
        items: items.map(({ passwordHash, twoFactorSecret, ...u }) => u),
        total: Number(countResult[0]?.count ?? 0),
        page: input.page,
        limit: input.limit,
      };
    }),

  // ── users: get by id ──
  getUser: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({ where: eq(users.id, input.id) });
      if (!user) throw Errors.notFound("Benutzer nicht gefunden.");
      const { passwordHash, twoFactorSecret, ...safe } = user;
      return safe;
    }),

  // ── users: block ──
  blockUser: adminQuery
    .input(z.object({ id: z.number().int().positive(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(users).set({ status: "blocked" }).where(eq(users.id, input.id));
      await db.insert(systemLogs).values({
        level: "warn",
        category: "admin",
        message: `User ${input.id} blocked. Reason: ${input.reason ?? "N/A"}`,
        metadata: { userId: input.id, reason: input.reason },
      });
      return { success: true };
    }),

  // ── users: unblock ──
  unblockUser: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(users).set({ status: "active" }).where(eq(users.id, input.id));
      await db.insert(systemLogs).values({
        level: "info",
        category: "admin",
        message: `User ${input.id} unblocked.`,
        metadata: { userId: input.id },
      });
      return { success: true };
    }),

  // ── users: assign role ──
  assignRole: adminQuery
    .input(z.object({
      id: z.number().int().positive(),
      role: z.enum(["admin", "seller", "customer"]),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(users).set({ role: input.role }).where(eq(users.id, input.id));
      return { success: true };
    }),

  // ── payment logs ──
  paymentLogs: adminQuery
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
      provider: z.enum(["stripe", "paypal", "crypto", "system"]).optional(),
      status: z.enum(["success", "failed", "pending"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const conditions = [];
      if (input.provider) conditions.push(eq(paymentLogs.provider, input.provider));
      if (input.status) conditions.push(eq(paymentLogs.status, input.status));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db.query.paymentLogs.findMany({
        where,
        with: { order: true },
        orderBy: (l, { desc }) => [desc(l.createdAt)],
        limit: input.limit,
        offset,
      });

      return { items, page: input.page, limit: input.limit };
    }),

  // ── system logs ──
  systemLogs: adminQuery
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
      level: z.enum(["info", "warn", "error", "debug"]).optional(),
      category: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const conditions = [];
      if (input.level) conditions.push(eq(systemLogs.level, input.level));
      if (input.category) conditions.push(eq(systemLogs.category, input.category));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db.query.systemLogs.findMany({
        where,
        orderBy: (l, { desc }) => [desc(l.createdAt)],
        limit: input.limit,
        offset,
      });

      return { items, page: input.page, limit: input.limit };
    }),

  // ── visitor stats ──
  visitorStats: adminQuery
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ input }) => {
      const db = getDb();
      const since = new Date();
      since.setDate(since.getDate() - input.days);
      const sinceStr = since.toISOString().split("T")[0];

      return db.query.visitorStats.findMany({
        where: gte(visitorStats.date, sinceStr),
        orderBy: (v, { asc }) => [asc(v.date)],
      });
    }),

  // ── track page view (internal) ──
  trackPageView: adminQuery.mutation(async () => {
    const db = getDb();
    const today = new Date().toISOString().split("T")[0];

    await db.insert(visitorStats).values({
      date: today,
      pageViews: 1,
      uniqueVisitors: 0,
      orders: 0,
      revenue: "0",
    }).onDuplicateKeyUpdate({
      set: { pageViews: sql`page_views + 1` },
    });

    return { success: true };
  }),

  // ── system overview ──
  systemOverview: adminQuery.query(async () => {
    const db = getDb();
    const [userCount, orderCount, affiliateCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(orders),
      db.select({ count: sql<number>`count(*)` }).from(affiliates),
    ]);

    return {
      users: Number(userCount[0]?.count ?? 0),
      orders: Number(orderCount[0]?.count ?? 0),
      affiliates: Number(affiliateCount[0]?.count ?? 0),
      nodeVersion: process.version,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }),

  // ── export orders CSV ──
  exportOrders: adminQuery
    .input(z.object({
      from: z.string().optional(),
      to: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input.from) conditions.push(gte(orders.createdAt, new Date(input.from)));
      if (input.to) conditions.push(gte(orders.createdAt, new Date(input.to)));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db.query.orders.findMany({
        where,
        with: { items: true, customer: true },
        orderBy: (o, { desc }) => [desc(o.createdAt)],
        limit: 10000,
      });

      // Build CSV
      const header = "Bestellnummer,Datum,Kunde,E-Mail,Gesamt,Status,Zahlungsmethode";
      const rows = items.map(o =>
        `${o.orderNumber},${o.createdAt?.toISOString()},${o.customerName ?? ""},${o.customerEmail},${o.total},${o.status},${o.paymentMethod}`
      );

      return { csv: [header, ...rows].join("\n"), count: items.length };
    }),
});
