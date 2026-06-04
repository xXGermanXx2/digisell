import { z } from "zod";
import { eq, and, sql, gte, desc } from "drizzle-orm";
import { createRouter, adminQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, products, orderItems, users, visitorStats } from "@db/schema";

export const analyticsRouter = createRouter({
  // ── Admin dashboard overview ──────────────────────────────────────────────
  dashboard: adminQuery.query(async () => {
    const db = getDb();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [revenueResult, ordersCount, productsCount, customersCount, recentRevenue, recentOrders, visitorData] = await Promise.all([
      db.select({ total: sql<string>`COALESCE(SUM(${orders.total}), 0)` }).from(orders).where(eq(orders.status, "completed")),
      db.select({ count: sql<number>`count(*)` }).from(orders),
      db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.status, "active")),
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "customer")),
      db.select({ total: sql<string>`COALESCE(SUM(${orders.total}), 0)` }).from(orders).where(and(eq(orders.status, "completed"), gte(orders.createdAt, thirtyDaysAgo))),
      db.select({ count: sql<number>`count(*)` }).from(orders).where(gte(orders.createdAt, thirtyDaysAgo)),
      db.select({
        totalViews: sql<number>`COALESCE(SUM(page_views), 0)`,
        totalVisitors: sql<number>`COALESCE(SUM(unique_visitors), 0)`,
      }).from(visitorStats).where(gte(visitorStats.createdAt, thirtyDaysAgo)),
    ]);

    const totalOrders = Number(ordersCount[0]?.count ?? 0);
    const totalVisitors = Number(visitorData[0]?.totalVisitors ?? 0);
    const conversionRate = totalVisitors > 0 ? ((totalOrders / totalVisitors) * 100).toFixed(2) : "0.00";

    return {
      totalRevenue: parseFloat(revenueResult[0]?.total ?? "0"),
      totalOrders,
      totalProducts: Number(productsCount[0]?.count ?? 0),
      totalCustomers: Number(customersCount[0]?.count ?? 0),
      recentRevenue: parseFloat(recentRevenue[0]?.total ?? "0"),
      recentOrders: Number(recentOrders[0]?.count ?? 0),
      totalPageViews: Number(visitorData[0]?.totalViews ?? 0),
      totalVisitors,
      conversionRate,
    };
  }),

  // ── Revenue chart ─────────────────────────────────────────────────────────
  revenue: adminQuery
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const days = input?.days ?? 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const dailyData = await db.select({
        date: sql<string>`DATE(${orders.createdAt})`,
        revenue: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
        orders: sql<number>`count(*)`,
      })
        .from(orders)
        .where(and(eq(orders.status, "completed"), gte(orders.createdAt, startDate)))
        .groupBy(sql`DATE(${orders.createdAt})`)
        .orderBy(sql`DATE(${orders.createdAt})`);

      return dailyData.map(d => ({ date: d.date, revenue: parseFloat(d.revenue), orders: Number(d.orders) }));
    }),

  // ── Visitor stats chart ───────────────────────────────────────────────────
  visitors: adminQuery
    .input(z.object({ days: z.number().int().min(1).max(90).default(30) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const days = input?.days ?? 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const data = await db.query.visitorStats.findMany({
        where: gte(visitorStats.createdAt, startDate),
        orderBy: [sql`date ASC`],
      });

      return data.map(d => ({
        date: d.date,
        pageViews: d.pageViews,
        uniqueVisitors: d.uniqueVisitors,
        orders: d.orders,
        revenue: parseFloat(d.revenue),
        conversionRate: d.uniqueVisitors > 0 ? ((d.orders / d.uniqueVisitors) * 100).toFixed(2) : "0.00",
      }));
    }),

  // ── Top products ──────────────────────────────────────────────────────────
  topProducts: adminQuery
    .input(z.object({ limit: z.number().int().min(1).max(20).default(10) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 10;
      const topProducts = await db.select({
        productId: orderItems.productId,
        productName: orderItems.productName,
        totalSold: sql<number>`SUM(${orderItems.quantity})`,
        totalRevenue: sql<string>`SUM(${orderItems.totalPrice})`,
      })
        .from(orderItems)
        .groupBy(orderItems.productId, orderItems.productName)
        .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
        .limit(limit);

      return topProducts.map(p => ({
        productId: p.productId,
        productName: p.productName,
        totalSold: Number(p.totalSold),
        totalRevenue: parseFloat(p.totalRevenue),
      }));
    }),

  // ── Sales by category ─────────────────────────────────────────────────────
  salesByCategory: adminQuery.query(async () => {
    const db = getDb();
    const result = await db.select({
      categoryName: sql<string>`COALESCE(categories.name, 'Ohne Kategorie')`,
      totalRevenue: sql<string>`COALESCE(SUM(${orderItems.totalPrice}), 0)`,
      totalOrders: sql<number>`count(*)`,
    })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(sql`categories`, sql`categories.id = ${products.categoryId}`)
      .where(eq(orders.status, "completed"))
      .groupBy(sql`COALESCE(categories.name, 'Ohne Kategorie')`);

    return result.map(r => ({
      categoryName: r.categoryName,
      totalRevenue: parseFloat(r.totalRevenue),
      totalOrders: Number(r.totalOrders),
    }));
  }),

  // ── Export orders as CSV ──────────────────────────────────────────────────
  exportOrders: adminQuery
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      status: z.enum(["pending", "paid", "completed", "cancelled", "refunded", "all"]).default("all"),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.status && input.status !== "all") conditions.push(eq(orders.status, input.status));
      if (input?.dateFrom) conditions.push(gte(orders.createdAt, new Date(input.dateFrom)));

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const allOrders = await db.query.orders.findMany({
        where,
        orderBy: [desc(orders.createdAt)],
        limit: 10000,
      });

      const header = "Bestellnummer,Datum,Kunde,E-Mail,Status,Zahlungsmethode,Gesamt,Währung";
      const rows = allOrders.map(o => [
        o.orderNumber,
        o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : "",
        `"${(o.customerName ?? "").replace(/"/g, '""')}"`,
        o.customerEmail,
        o.status,
        o.paymentMethod ?? "",
        o.total,
        o.currency,
      ].join(","));

      return { csv: [header, ...rows].join("\n"), count: allOrders.length };
    }),

  // ── Track page view (public, called from frontend) ────────────────────────
  trackPageView: publicQuery
    .input(z.object({
      page: z.string().max(255).optional(),
      isUnique: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const today = new Date().toISOString().split("T")[0];
      await db.insert(visitorStats).values({
        date: today,
        pageViews: 1,
        uniqueVisitors: input.isUnique ? 1 : 0,
        orders: 0,
        revenue: "0",
      }).onDuplicateKeyUpdate({
        set: {
          pageViews: sql`page_views + 1`,
          uniqueVisitors: input.isUnique ? sql`unique_visitors + 1` : sql`unique_visitors`,
          updatedAt: new Date(),
        },
      });
      return { success: true };
    }),
});
