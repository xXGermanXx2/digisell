import { z } from "zod";
import { eq, like, or, desc, sql, and, gte, lte, ne, inArray } from "drizzle-orm";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  users, systemLogs, orders, orderItems, paymentLogs, visitorStats,
  affiliates, affiliateClicks, affiliateConversions,
  products, categories, reviews, tickets, ticketMessages,
  subscriptions, coupons, fraudRules, shopSettings,
  deliveryLogs, licenseKeys, webhooks,
  shops, reports, loginLogs, adminRoles, moderationLogs, blocklists, bannedWords,
} from "@db/schema";
import { Errors } from "@contracts/errors";
import { sendEmail } from "./lib/email";

export const adminRouter = createRouter({

  // ═══════════════════════════════════════════════════════════
  // ADMIN DASHBOARD — Alle Stats auf einen Blick
  // ═══════════════════════════════════════════════════════════

  dashboardStats: adminQuery.query(async () => {
    const db = getDb();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers, totalProducts, totalOrders, totalTickets,
      todayOrders, weekOrders, monthOrders,
      newRegistrations, activeUsers,
      revenueTotal, revenueToday, revenueWeek, revenueMonth,
      lastOrders, lastPayments, lastRegistrations,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(products),
      db.select({ count: sql<number>`count(*)` }).from(orders),
      db.select({ count: sql<number>`count(*)` }).from(tickets),
      db.select({ count: sql<number>`count(*)` }).from(orders).where(gte(orders.createdAt, todayStart)),
      db.select({ count: sql<number>`count(*)` }).from(orders).where(gte(orders.createdAt, weekStart)),
      db.select({ count: sql<number>`count(*)` }).from(orders).where(gte(orders.createdAt, monthStart)),
      db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, weekStart)),
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.status, "active")),
      db.select({ sum: sql<string>`COALESCE(SUM(total), 0)` }).from(orders).where(eq(orders.status, "completed")),
      db.select({ sum: sql<string>`COALESCE(SUM(total), 0)` }).from(orders).where(and(eq(orders.status, "completed"), gte(orders.createdAt, todayStart))),
      db.select({ sum: sql<string>`COALESCE(SUM(total), 0)` }).from(orders).where(and(eq(orders.status, "completed"), gte(orders.createdAt, weekStart))),
      db.select({ sum: sql<string>`COALESCE(SUM(total), 0)` }).from(orders).where(and(eq(orders.status, "completed"), gte(orders.createdAt, monthStart))),
      db.query.orders.findMany({ with: { customer: true }, orderBy: [desc(orders.createdAt)], limit: 5 }),
      db.query.paymentLogs.findMany({ orderBy: [desc(paymentLogs.createdAt)], limit: 5 }),
      db.query.users.findMany({ orderBy: [desc(users.createdAt)], limit: 5 }),
    ]);

    return {
      stats: {
        totalUsers: Number(totalUsers[0]?.count ?? 0),
        totalProducts: Number(totalProducts[0]?.count ?? 0),
        totalOrders: Number(totalOrders[0]?.count ?? 0),
        totalTickets: Number(totalTickets[0]?.count ?? 0),
        todayOrders: Number(todayOrders[0]?.count ?? 0),
        weekOrders: Number(weekOrders[0]?.count ?? 0),
        monthOrders: Number(monthOrders[0]?.count ?? 0),
        newRegistrations: Number(newRegistrations[0]?.count ?? 0),
        activeUsers: Number(activeUsers[0]?.count ?? 0),
        revenueTotal: Number(revenueTotal[0]?.sum ?? 0),
        revenueToday: Number(revenueToday[0]?.sum ?? 0),
        revenueWeek: Number(revenueWeek[0]?.sum ?? 0),
        revenueMonth: Number(revenueMonth[0]?.sum ?? 0),
      },
      lastOrders: lastOrders.map(o => ({
        id: o.id, orderNumber: o.orderNumber, total: o.total,
        status: o.status, createdAt: o.createdAt,
        customer: o.customer ? { name: o.customer.name, email: o.customer.email } : null,
      })),
      lastPayments: lastPayments.map(p => ({
        id: p.id, provider: p.provider, amount: p.amount,
        status: p.status, createdAt: p.createdAt,
      })),
      lastRegistrations: lastRegistrations.map(({ passwordHash, twoFactorSecret, ...u }) => u),
      system: {
        nodeVersion: process.version,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    };
  }),

  // Revenue chart data (letzte N Tage)
  revenueChart: adminQuery
    .input(z.object({ days: z.number().int().min(7).max(365).default(30) }))
    .query(async ({ input }) => {
      const db = getDb();
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const rows = await db.select({
        date: sql<string>`DATE(created_at)`,
        revenue: sql<string>`COALESCE(SUM(total), 0)`,
        count: sql<number>`count(*)`,
      })
        .from(orders)
        .where(and(eq(orders.status, "completed"), gte(orders.createdAt, since)))
        .groupBy(sql`DATE(created_at)`)
        .orderBy(sql`DATE(created_at)`);

      return rows;
    }),

  // User growth chart
  userGrowthChart: adminQuery
    .input(z.object({ days: z.number().int().min(7).max(365).default(30) }))
    .query(async ({ input }) => {
      const db = getDb();
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const rows = await db.select({
        date: sql<string>`DATE(created_at)`,
        count: sql<number>`count(*)`,
      })
        .from(users)
        .where(gte(users.createdAt, since))
        .groupBy(sql`DATE(created_at)`)
        .orderBy(sql`DATE(created_at)`);

      return rows;
    }),

  // ═══════════════════════════════════════════════════════════
  // NUTZERVERWALTUNG — Vollständig
  // ═══════════════════════════════════════════════════════════

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
      if (input.search) conditions.push(or(like(users.name, `%${input.search}%`), like(users.email, `%${input.search}%`)));
      if (input.role) conditions.push(eq(users.role, input.role));
      if (input.status) conditions.push(eq(users.status, input.status));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        db.query.users.findMany({ where, orderBy: [desc(users.createdAt)], limit: input.limit, offset }),
        db.select({ count: sql<number>`count(*)` }).from(users).where(where),
      ]);

      return {
        items: items.map(({ passwordHash, twoFactorSecret, ...u }) => u),
        total: Number(countResult[0]?.count ?? 0),
        page: input.page,
        limit: input.limit,
      };
    }),

  getUser: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({ where: eq(users.id, input.id) });
      if (!user) throw Errors.notFound("Benutzer nicht gefunden.");
      const { passwordHash, twoFactorSecret, ...safe } = user;

      // Bestellungen des Nutzers
      const userOrders = await db.query.orders.findMany({
        where: eq(orders.customerId, input.id),
        orderBy: [desc(orders.createdAt)],
        limit: 10,
      });

      // Zahlungen des Nutzers
      const userPayments = await db.query.paymentLogs.findMany({
        where: eq(paymentLogs.orderId, input.id),
        orderBy: [desc(paymentLogs.createdAt)],
        limit: 10,
      });

      // Login-Historie (aus systemLogs)
      const loginHistory = await db.query.systemLogs.findMany({
        where: and(eq(systemLogs.category, "auth"), like(systemLogs.message, `%${input.id}%`)),
        orderBy: [desc(systemLogs.createdAt)],
        limit: 20,
      });

      return { user: safe, orders: userOrders, payments: userPayments, loginHistory };
    }),

  updateUser: adminQuery
    .input(z.object({
      id: z.number().int().positive(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      role: z.enum(["admin", "seller", "customer"]).optional(),
      status: z.enum(["active", "blocked", "pending"]).optional(),
      emailVerified: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(users).set(data).where(eq(users.id, id));
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} updated user ${id}`,
        metadata: { adminId: ctx.user.id, userId: id, changes: data },
      });
      return { success: true };
    }),

  deleteUser: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.delete(users).where(eq(users.id, input.id));
      await db.insert(systemLogs).values({
        level: "warn", category: "admin",
        message: `Admin ${ctx.user.id} deleted user ${input.id}`,
        metadata: { adminId: ctx.user.id, userId: input.id },
      });
      return { success: true };
    }),

  blockUser: adminQuery
    .input(z.object({ id: z.number().int().positive(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(users).set({ status: "blocked" }).where(eq(users.id, input.id));
      await db.insert(systemLogs).values({
        level: "warn", category: "admin",
        message: `Admin ${ctx.user.id} blocked user ${input.id}. Reason: ${input.reason ?? "N/A"}`,
        metadata: { adminId: ctx.user.id, userId: input.id, reason: input.reason },
      });
      return { success: true };
    }),

  unblockUser: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(users).set({ status: "active" }).where(eq(users.id, input.id));
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} unblocked user ${input.id}`,
        metadata: { adminId: ctx.user.id, userId: input.id },
      });
      return { success: true };
    }),

  verifyUser: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(users).set({ emailVerified: true, status: "active" }).where(eq(users.id, input.id));
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} manually verified user ${input.id}`,
        metadata: { adminId: ctx.user.id, userId: input.id },
      });
      return { success: true };
    }),

  assignRole: adminQuery
    .input(z.object({ id: z.number().int().positive(), role: z.enum(["admin", "seller", "customer"]) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(users).set({ role: input.role }).where(eq(users.id, input.id));
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} set role ${input.role} for user ${input.id}`,
        metadata: { adminId: ctx.user.id, userId: input.id, role: input.role },
      });
      return { success: true };
    }),

  sendWarning: adminQuery
    .input(z.object({ userId: z.number().int().positive(), subject: z.string(), message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({ where: eq(users.id, input.userId) });
      if (!user?.email) throw Errors.notFound("Benutzer nicht gefunden.");

      await sendEmail({
        to: user.email,
        subject: `[DigiSell] Warnung: ${input.subject}`,
        html: `<p>${input.message}</p>`,
      });

      await db.insert(systemLogs).values({
        level: "warn", category: "admin",
        message: `Admin ${ctx.user.id} sent warning to user ${input.userId}: ${input.subject}`,
        metadata: { adminId: ctx.user.id, userId: input.userId },
      });

      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════
  // PRODUKTVERWALTUNG — Admin-Sicht
  // ═══════════════════════════════════════════════════════════

  listProducts: adminQuery
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["active", "inactive", "draft"]).optional(),
      categoryId: z.number().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions = [];
      if (input.search) conditions.push(like(products.name, `%${input.search}%`));
      if (input.status) conditions.push(eq(products.status, input.status));
      if (input.categoryId) conditions.push(eq(products.categoryId, input.categoryId));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        db.query.products.findMany({
          where,
          with: { category: true },
          orderBy: [desc(products.createdAt)],
          limit: input.limit,
          offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(products).where(where),
      ]);

      return { items, total: Number(countResult[0]?.count ?? 0), page: input.page, limit: input.limit };
    }),

  getProduct: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const product = await db.query.products.findFirst({
        where: eq(products.id, input.id),
        with: { category: true, reviews: { with: { user: true } } },
      });
      if (!product) throw Errors.notFound("Produkt nicht gefunden.");

      const [orderCount, keyStats] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(orderItems).where(eq(orderItems.productId, input.id)),
        db.select({
          total: sql<number>`count(*)`,
          available: sql<number>`SUM(CASE WHEN used = 0 THEN 1 ELSE 0 END)`,
        }).from(licenseKeys).where(eq(licenseKeys.productId, input.id)),
      ]);

      return { product, orderCount: Number(orderCount[0]?.count ?? 0), keyStats: keyStats[0] };
    }),

  updateProduct: adminQuery
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["active", "inactive", "draft"]).optional(),
      name: z.string().optional(),
      price: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(products).set(data).where(eq(products.id, id));
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} updated product ${id}`,
        metadata: { adminId: ctx.user.id, productId: id, changes: data },
      });
      return { success: true };
    }),

  deleteProduct: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(products).set({ status: "inactive" }).where(eq(products.id, input.id));
      await db.insert(systemLogs).values({
        level: "warn", category: "admin",
        message: `Admin ${ctx.user.id} deactivated product ${input.id}`,
        metadata: { adminId: ctx.user.id, productId: input.id },
      });
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════
  // BESTELLVERWALTUNG — Admin-Sicht
  // ═══════════════════════════════════════════════════════════

  listOrders: adminQuery
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["pending", "processing", "completed", "cancelled", "refunded"]).optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions = [];
      if (input.search) conditions.push(or(like(orders.orderNumber, `%${input.search}%`), like(orders.customerEmail, `%${input.search}%`)));
      if (input.status) conditions.push(eq(orders.status, input.status));
      if (input.from) conditions.push(gte(orders.createdAt, new Date(input.from)));
      if (input.to) conditions.push(lte(orders.createdAt, new Date(input.to)));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        db.query.orders.findMany({
          where,
          with: { customer: true, items: { with: { product: true } } },
          orderBy: [desc(orders.createdAt)],
          limit: input.limit,
          offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(orders).where(where),
      ]);

      return { items, total: Number(countResult[0]?.count ?? 0), page: input.page, limit: input.limit };
    }),

  getOrder: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, input.id),
        with: { customer: true, items: { with: { product: true } } },
      });
      if (!order) throw Errors.notFound("Bestellung nicht gefunden.");

      const [payments, delivery] = await Promise.all([
        db.query.paymentLogs.findMany({ where: eq(paymentLogs.orderId, input.id), orderBy: [desc(paymentLogs.createdAt)] }),
        db.query.deliveryLogs.findMany({ where: eq(deliveryLogs.orderId, input.id), orderBy: [desc(deliveryLogs.createdAt)] }),
      ]);

      return { order, payments, delivery };
    }),

  updateOrderStatus: adminQuery
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["pending", "processing", "completed", "cancelled", "refunded"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.id));
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} changed order ${input.id} status to ${input.status}`,
        metadata: { adminId: ctx.user.id, orderId: input.id, status: input.status },
      });
      return { success: true };
    }),

  cancelOrder: adminQuery
    .input(z.object({ id: z.number().int().positive(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, input.id));
      await db.insert(systemLogs).values({
        level: "warn", category: "admin",
        message: `Admin ${ctx.user.id} cancelled order ${input.id}. Reason: ${input.reason ?? "N/A"}`,
        metadata: { adminId: ctx.user.id, orderId: input.id, reason: input.reason },
      });
      return { success: true };
    }),

  refundOrder: adminQuery
    .input(z.object({ id: z.number().int().positive(), amount: z.string().optional(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const order = await db.query.orders.findFirst({ where: eq(orders.id, input.id) });
      if (!order) throw Errors.notFound("Bestellung nicht gefunden.");

      await db.update(orders).set({ status: "refunded" }).where(eq(orders.id, input.id));
      await db.insert(paymentLogs).values({
        orderId: input.id,
        provider: (order.paymentMethod as any) ?? "system",
        status: "success",
        amount: input.amount ?? order.total,
        currency: "EUR",
        metadata: { type: "refund", reason: input.reason, adminId: ctx.user.id },
      });
      await db.insert(systemLogs).values({
        level: "warn", category: "admin",
        message: `Admin ${ctx.user.id} refunded order ${input.id}. Amount: ${input.amount ?? order.total}`,
        metadata: { adminId: ctx.user.id, orderId: input.id, amount: input.amount },
      });
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════
  // ZAHLUNGSVERWALTUNG
  // ═══════════════════════════════════════════════════════════

  listPayments: adminQuery
    .input(z.object({
      search: z.string().optional(),
      provider: z.enum(["stripe", "paypal", "crypto", "system"]).optional(),
      status: z.enum(["success", "failed", "pending"]).optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions = [];
      if (input.provider) conditions.push(eq(paymentLogs.provider, input.provider));
      if (input.status) conditions.push(eq(paymentLogs.status, input.status));
      if (input.from) conditions.push(gte(paymentLogs.createdAt, new Date(input.from)));
      if (input.to) conditions.push(lte(paymentLogs.createdAt, new Date(input.to)));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult, failedCount, chargebackCount] = await Promise.all([
        db.query.paymentLogs.findMany({
          where,
          with: { order: true },
          orderBy: [desc(paymentLogs.createdAt)],
          limit: input.limit,
          offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(paymentLogs).where(where),
        db.select({ count: sql<number>`count(*)` }).from(paymentLogs).where(eq(paymentLogs.status, "failed")),
        db.select({ count: sql<number>`count(*)` }).from(paymentLogs).where(like(paymentLogs.provider, "%chargeback%")),
      ]);

      return {
        items,
        total: Number(countResult[0]?.count ?? 0),
        failedCount: Number(failedCount[0]?.count ?? 0),
        chargebackCount: Number(chargebackCount[0]?.count ?? 0),
        page: input.page,
        limit: input.limit,
      };
    }),

  // ═══════════════════════════════════════════════════════════
  // TICKETSYSTEM — Admin
  // ═══════════════════════════════════════════════════════════

  listTickets: adminQuery
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["open", "in_progress", "closed"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions = [];
      if (input.search) conditions.push(or(like(tickets.subject, `%${input.search}%`), like(tickets.category, `%${input.search}%`)));
      if (input.status) conditions.push(eq(tickets.status, input.status));
      if (input.priority) conditions.push(eq(tickets.priority, input.priority));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        db.query.tickets.findMany({
          where,
          with: { user: true, messages: true },
          orderBy: [desc(tickets.updatedAt)],
          limit: input.limit,
          offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(tickets).where(where),
      ]);

      return { items, total: Number(countResult[0]?.count ?? 0), page: input.page, limit: input.limit };
    }),

  getTicket: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, input.id),
        with: { user: true, messages: { with: { user: true } } },
      });
      if (!ticket) throw Errors.notFound("Ticket nicht gefunden.");
      return ticket;
    }),

  replyTicket: adminQuery
    .input(z.object({ ticketId: z.number().int().positive(), message: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(ticketMessages).values({
        ticketId: input.ticketId,
        userId: ctx.user.id,
        message: input.message,
        isStaff: true,
      });
      await db.update(tickets).set({ status: "in_progress", updatedAt: new Date() }).where(eq(tickets.id, input.ticketId));
      return { success: true };
    }),

  updateTicketStatus: adminQuery
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["open", "in_progress", "closed"]) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(tickets).set({ status: input.status, updatedAt: new Date() }).where(eq(tickets.id, input.id));
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════
  // AFFILIATE — Admin
  // ═══════════════════════════════════════════════════════════

  listAffiliates: adminQuery
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["active", "inactive", "pending"]).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions = [];
      if (input.status) conditions.push(eq(affiliates.status, input.status));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db.query.affiliates.findMany({
        where,
        with: { user: true },
        orderBy: [desc(affiliates.createdAt)],
        limit: input.limit,
        offset,
      });

      return { items, page: input.page, limit: input.limit };
    }),

  updateAffiliateCommission: adminQuery
    .input(z.object({ id: z.number().int().positive(), commissionRate: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(affiliates).set({ commissionRate: input.commissionRate }).where(eq(affiliates.id, input.id));
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} updated affiliate ${input.id} commission to ${input.commissionRate}`,
        metadata: { adminId: ctx.user.id, affiliateId: input.id },
      });
      return { success: true };
    }),

  payoutAffiliate: adminQuery
    .input(z.object({ affiliateId: z.number().int().positive(), amount: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(affiliates).set({
        totalPaid: sql`total_paid + ${input.amount}`,
        pendingAmount: sql`GREATEST(0, pending_amount - ${input.amount})`,
      }).where(eq(affiliates.id, input.affiliateId));
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} paid out ${input.amount} to affiliate ${input.affiliateId}`,
        metadata: { adminId: ctx.user.id, affiliateId: input.affiliateId, amount: input.amount },
      });
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════
  // ABONNEMENTS — Admin
  // ═══════════════════════════════════════════════════════════

  listSubscriptions: adminQuery
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["active", "cancelled", "expired", "trial"]).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions = [];
      if (input.status) conditions.push(eq(subscriptions.status, input.status));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        db.query.subscriptions.findMany({
          where,
          with: { user: true, product: true },
          orderBy: [desc(subscriptions.createdAt)],
          limit: input.limit,
          offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(where),
      ]);

      return { items, total: Number(countResult[0]?.count ?? 0), page: input.page, limit: input.limit };
    }),

  cancelSubscription: adminQuery
    .input(z.object({ id: z.number().int().positive(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(subscriptions).set({ status: "cancelled", cancelledAt: new Date() }).where(eq(subscriptions.id, input.id));
      await db.insert(systemLogs).values({
        level: "warn", category: "admin",
        message: `Admin ${ctx.user.id} cancelled subscription ${input.id}`,
        metadata: { adminId: ctx.user.id, subscriptionId: input.id, reason: input.reason },
      });
      return { success: true };
    }),

  extendSubscription: adminQuery
    .input(z.object({ id: z.number().int().positive(), days: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.id, input.id) });
      if (!sub) throw Errors.notFound("Abonnement nicht gefunden.");

      const currentEnd = sub.currentPeriodEnd ?? new Date();
      const newEnd = new Date(currentEnd);
      newEnd.setDate(newEnd.getDate() + input.days);

      await db.update(subscriptions).set({ currentPeriodEnd: newEnd, status: "active" }).where(eq(subscriptions.id, input.id));
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} extended subscription ${input.id} by ${input.days} days`,
        metadata: { adminId: ctx.user.id, subscriptionId: input.id, days: input.days },
      });
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════
  // ANALYTICS — Plattform-Übersicht
  // ═══════════════════════════════════════════════════════════

  platformAnalytics: adminQuery
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ input }) => {
      const db = getDb();
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const [
        revenueData, userGrowth, orderStats, paymentStats,
        topProducts, conversionData,
      ] = await Promise.all([
        db.select({
          date: sql<string>`DATE(created_at)`,
          revenue: sql<string>`COALESCE(SUM(total), 0)`,
          orders: sql<number>`count(*)`,
        }).from(orders).where(and(eq(orders.status, "completed"), gte(orders.createdAt, since)))
          .groupBy(sql`DATE(created_at)`).orderBy(sql`DATE(created_at)`),

        db.select({
          date: sql<string>`DATE(created_at)`,
          count: sql<number>`count(*)`,
        }).from(users).where(gte(users.createdAt, since))
          .groupBy(sql`DATE(created_at)`).orderBy(sql`DATE(created_at)`),

        db.select({
          status: orders.status,
          count: sql<number>`count(*)`,
          total: sql<string>`COALESCE(SUM(total), 0)`,
        }).from(orders).where(gte(orders.createdAt, since)).groupBy(orders.status),

        db.select({
          provider: paymentLogs.provider,
          status: paymentLogs.status,
          count: sql<number>`count(*)`,
          total: sql<string>`COALESCE(SUM(amount), 0)`,
        }).from(paymentLogs).where(gte(paymentLogs.createdAt, since))
          .groupBy(paymentLogs.provider, paymentLogs.status),

        db.select({
          productId: orderItems.productId,
          count: sql<number>`count(*)`,
          revenue: sql<string>`COALESCE(SUM(price), 0)`,
        }).from(orderItems)
          .groupBy(orderItems.productId)
          .orderBy(sql`count(*) DESC`)
          .limit(10),

        db.query.visitorStats.findMany({
          where: gte(visitorStats.date, since.toISOString().split("T")[0]),
          orderBy: [desc(visitorStats.date)],
          limit: input.days,
        }),
      ]);

      return { revenueData, userGrowth, orderStats, paymentStats, topProducts, conversionData };
    }),

  // ═══════════════════════════════════════════════════════════
  // SICHERHEIT — Logs, IP-Sperrliste, Fraud
  // ═══════════════════════════════════════════════════════════

  loginLogs: adminQuery
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const items = await db.query.systemLogs.findMany({
        where: eq(systemLogs.category, "auth"),
        orderBy: [desc(systemLogs.createdAt)],
        limit: input.limit,
        offset,
      });
      return { items, page: input.page, limit: input.limit };
    }),

  adminActivityLogs: adminQuery
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const items = await db.query.systemLogs.findMany({
        where: eq(systemLogs.category, "admin"),
        orderBy: [desc(systemLogs.createdAt)],
        limit: input.limit,
        offset,
      });
      return { items, page: input.page, limit: input.limit };
    }),

  securityAlerts: adminQuery.query(async () => {
    const db = getDb();
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [failedLogins, blockedUsers, fraudCases] = await Promise.all([
      db.query.systemLogs.findMany({
        where: and(eq(systemLogs.category, "auth"), eq(systemLogs.level, "warn"), gte(systemLogs.createdAt, since)),
        orderBy: [desc(systemLogs.createdAt)],
        limit: 20,
      }),
      db.query.users.findMany({
        where: eq(users.status, "blocked"),
        orderBy: [desc(users.updatedAt)],
        limit: 10,
      }),
      db.query.fraudRules.findMany({ limit: 20 }),
    ]);

    return {
      failedLogins: failedLogins.map(({ passwordHash, twoFactorSecret, ...u }: any) => u ?? u),
      blockedUsers: blockedUsers.map(({ passwordHash, twoFactorSecret, ...u }) => u),
      fraudCases,
    };
  }),

  listFraudRules: adminQuery.query(async () => {
    const db = getDb();
    return db.query.fraudRules.findMany({ orderBy: [desc(fraudRules.createdAt)] });
  }),

  addFraudRule: adminQuery
    .input(z.object({
      type: z.enum(["ip", "email", "domain", "country"]),
      value: z.string().min(1),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(fraudRules).values({ ...input, isActive: true });
      await db.insert(systemLogs).values({
        level: "warn", category: "admin",
        message: `Admin ${ctx.user.id} added fraud rule: ${input.type}=${input.value}`,
        metadata: { adminId: ctx.user.id, rule: input },
      });
      return { success: true };
    }),

  deleteFraudRule: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(fraudRules).where(eq(fraudRules.id, input.id));
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════
  // SYSTEMVERWALTUNG
  // ═══════════════════════════════════════════════════════════

  systemOverview: adminQuery.query(async () => {
    const db = getDb();
    const [userCount, orderCount, affiliateCount, productCount, ticketCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(orders),
      db.select({ count: sql<number>`count(*)` }).from(affiliates),
      db.select({ count: sql<number>`count(*)` }).from(products),
      db.select({ count: sql<number>`count(*)` }).from(tickets),
    ]);

    return {
      users: Number(userCount[0]?.count ?? 0),
      orders: Number(orderCount[0]?.count ?? 0),
      affiliates: Number(affiliateCount[0]?.count ?? 0),
      products: Number(productCount[0]?.count ?? 0),
      tickets: Number(ticketCount[0]?.count ?? 0),
      nodeVersion: process.version,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }),

  getShopSettings: adminQuery.query(async () => {
    const db = getDb();
    return db.query.shopSettings.findFirst();
  }),

  updateShopSettings: adminQuery
    .input(z.object({
      shopName: z.string().optional(),
      shopDescription: z.string().optional(),
      shopEmail: z.string().email().optional(),
      maintenanceMode: z.boolean().optional(),
      stripeEnabled: z.boolean().optional(),
      paypalEnabled: z.boolean().optional(),
      cryptoEnabled: z.boolean().optional(),
      smtpHost: z.string().optional(),
      smtpPort: z.number().optional(),
      smtpUser: z.string().optional(),
      smtpPass: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const existing = await db.query.shopSettings.findFirst();
      if (existing) {
        await db.update(shopSettings).set(input).where(eq(shopSettings.id, existing.id));
      } else {
        await db.insert(shopSettings).values(input as any);
      }
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} updated shop settings`,
        metadata: { adminId: ctx.user.id },
      });
      return { success: true };
    }),

  // ── Logs ──
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
        orderBy: [desc(paymentLogs.createdAt)],
        limit: input.limit,
        offset,
      });
      return { items, page: input.page, limit: input.limit };
    }),

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
        orderBy: [desc(systemLogs.createdAt)],
        limit: input.limit,
        offset,
      });
      return { items, page: input.page, limit: input.limit };
    }),

  visitorStats: adminQuery
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ input }) => {
      const db = getDb();
      const since = new Date();
      since.setDate(since.getDate() - input.days);
      return db.query.visitorStats.findMany({
        where: gte(visitorStats.date, since.toISOString().split("T")[0]),
        orderBy: (v, { asc }) => [asc(v.date)],
      });
    }),

  exportOrders: adminQuery
    .input(z.object({ from: z.string().optional(), to: z.string().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input.from) conditions.push(gte(orders.createdAt, new Date(input.from)));
      if (input.to) conditions.push(lte(orders.createdAt, new Date(input.to)));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db.query.orders.findMany({
        where,
        with: { items: true, customer: true },
        orderBy: [desc(orders.createdAt)],
        limit: 10000,
      });

      const header = "Bestellnummer,Datum,Kunde,E-Mail,Gesamt,Status,Zahlungsmethode";
      const rows = items.map(o =>
        `${o.orderNumber},${o.createdAt?.toISOString()},${o.customerName ?? ""},${o.customerEmail},${o.total},${o.status},${o.paymentMethod}`
      );
      return { csv: [header, ...rows].join("\n"), count: items.length };
    }),

  // ═══════════════════════════════════════════════════════════
  // SHOPVERWALTUNG — Admin
  // ═══════════════════════════════════════════════════════════

  listShops: adminQuery
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["active", "inactive", "suspended"]).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions: any[] = [];
      if (input.search) conditions.push(or(like(shops.name, `%${input.search}%`), like(shops.slug, `%${input.search}%`)));
      if (input.status) conditions.push(eq(shops.status, input.status));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        db.query.shops.findMany({
          where,
          with: { owner: true },
          orderBy: [desc(shops.createdAt)],
          limit: input.limit,
          offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(shops).where(where),
      ]);

      return { items, total: Number(countResult[0]?.count ?? 0), page: input.page, limit: input.limit };
    }),

  getShop: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const shop = await db.query.shops.findFirst({
        where: eq(shops.id, input.id),
        with: { owner: true },
      });
      if (!shop) throw Errors.notFound("Shop nicht gefunden.");

      const [shopProducts, shopOrders, shopRevenue] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.sellerId, shop.ownerId)),
        db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.sellerId, shop.ownerId)),
        db.select({ sum: sql<string>`COALESCE(SUM(total), 0)` }).from(orders)
          .where(and(eq(orders.sellerId, shop.ownerId), eq(orders.status, "completed"))),
      ]);

      return {
        shop,
        stats: {
          products: Number(shopProducts[0]?.count ?? 0),
          orders: Number(shopOrders[0]?.count ?? 0),
          revenue: Number(shopRevenue[0]?.sum ?? 0),
        },
      };
    }),

  updateShopStatus: adminQuery
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["active", "inactive", "suspended"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(shops).set({ status: input.status }).where(eq(shops.id, input.id));
      await db.insert(systemLogs).values({
        level: "warn", category: "admin",
        message: `Admin ${ctx.user.id} set shop ${input.id} status to ${input.status}. Reason: ${input.reason ?? "N/A"}`,
        metadata: { adminId: ctx.user.id, shopId: input.id, status: input.status, reason: input.reason },
      });
      return { success: true };
    }),

  deleteShop: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.delete(shops).where(eq(shops.id, input.id));
      await db.insert(systemLogs).values({
        level: "warn", category: "admin",
        message: `Admin ${ctx.user.id} deleted shop ${input.id}`,
        metadata: { adminId: ctx.user.id, shopId: input.id },
      });
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════
  // MELDUNGEN & MODERATION
  // ═══════════════════════════════════════════════════════════

  listReports: adminQuery
    .input(z.object({
      status: z.enum(["pending", "reviewed", "resolved", "dismissed"]).optional(),
      type: z.enum(["product", "user", "review", "shop"]).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions: any[] = [];
      if (input.status) conditions.push(eq(reports.status, input.status));
      if (input.type) conditions.push(eq(reports.type, input.type));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        db.query.reports.findMany({
          where,
          with: { reporter: true },
          orderBy: [desc(reports.createdAt)],
          limit: input.limit,
          offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(reports).where(where),
      ]);

      return { items, total: Number(countResult[0]?.count ?? 0), page: input.page, limit: input.limit };
    }),

  updateReportStatus: adminQuery
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["pending", "reviewed", "resolved", "dismissed"]),
      note: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(reports).set({ status: input.status, reviewNote: input.note, reviewedBy: ctx.user.id, reviewedAt: new Date() })
        .where(eq(reports.id, input.id));
      await db.insert(moderationLogs).values({
        adminId: ctx.user.id,
        action: `report_${input.status}`,
        targetType: "report",
        targetId: input.id,
        note: input.note,
      });
      return { success: true };
    }),

  createReport: adminQuery
    .input(z.object({
      type: z.enum(["product", "user", "review", "shop"]),
      targetId: z.number().int().positive(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(reports).values({
        reporterId: ctx.user.id,
        type: input.type,
        targetId: input.targetId,
        reason: input.reason,
        status: "pending",
      });
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════
  // LOGIN-LOGS — Dedizierte Tabelle
  // ═══════════════════════════════════════════════════════════

  getLoginLogs: adminQuery
    .input(z.object({
      userId: z.number().int().positive().optional(),
      success: z.boolean().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions: any[] = [];
      if (input.userId) conditions.push(eq(loginLogs.userId, input.userId));
      if (input.success !== undefined) conditions.push(eq(loginLogs.success, input.success));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        db.query.loginLogs.findMany({
          where,
          with: { user: true },
          orderBy: [desc(loginLogs.createdAt)],
          limit: input.limit,
          offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(loginLogs).where(where),
      ]);

      return { items, total: Number(countResult[0]?.count ?? 0), page: input.page, limit: input.limit };
    }),

  // ═══════════════════════════════════════════════════════════
  // ADMIN-ROLLEN
  // ═══════════════════════════════════════════════════════════

  listAdminRoles: adminQuery.query(async () => {
    const db = getDb();
    return db.query.adminRoles.findMany({ orderBy: [desc(adminRoles.createdAt)] });
  }),

  createAdminRole: adminQuery
    .input(z.object({
      name: z.string().min(1),
      permissions: z.array(z.string()),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(adminRoles).values({
        name: input.name,
        permissions: JSON.stringify(input.permissions),
        description: input.description,
        createdBy: ctx.user.id,
      });
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} created role: ${input.name}`,
        metadata: { adminId: ctx.user.id, roleName: input.name },
      });
      return { success: true };
    }),

  updateAdminRole: adminQuery
    .input(z.object({
      id: z.number().int().positive(),
      name: z.string().optional(),
      permissions: z.array(z.string()).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { id, permissions, ...rest } = input;
      const data: any = { ...rest };
      if (permissions) data.permissions = JSON.stringify(permissions);
      await db.update(adminRoles).set(data).where(eq(adminRoles.id, id));
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} updated role ${id}`,
        metadata: { adminId: ctx.user.id, roleId: id },
      });
      return { success: true };
    }),

  deleteAdminRole: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.delete(adminRoles).where(eq(adminRoles.id, input.id));
      await db.insert(systemLogs).values({
        level: "warn", category: "admin",
        message: `Admin ${ctx.user.id} deleted role ${input.id}`,
        metadata: { adminId: ctx.user.id, roleId: input.id },
      });
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════
  // MODERATIONS-LOGS
  // ═══════════════════════════════════════════════════════════

  getModerationLogs: adminQuery
    .input(z.object({
      adminId: z.number().int().positive().optional(),
      targetType: z.string().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions: any[] = [];
      if (input.adminId) conditions.push(eq(moderationLogs.adminId, input.adminId));
      if (input.targetType) conditions.push(eq(moderationLogs.targetType, input.targetType));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        db.query.moderationLogs.findMany({
          where,
          with: { admin: true },
          orderBy: [desc(moderationLogs.createdAt)],
          limit: input.limit,
          offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(moderationLogs).where(where),
      ]);

      return { items, total: Number(countResult[0]?.count ?? 0), page: input.page, limit: input.limit };
    }),

  // ═══════════════════════════════════════════════════════════
  // USER-PANEL — Shop-Betreiber-Sicht (für Seller)
  // ═══════════════════════════════════════════════════════════

  myShopStats: adminQuery.query(async ({ ctx }) => {
    const db = getDb();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [myProducts, myOrders, myRevenue, myMonthRevenue, myCustomers] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.sellerId, ctx.user.id)),
      db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.sellerId, ctx.user.id)),
      db.select({ sum: sql<string>`COALESCE(SUM(total), 0)` }).from(orders)
        .where(and(eq(orders.sellerId, ctx.user.id), eq(orders.status, "completed"))),
      db.select({ sum: sql<string>`COALESCE(SUM(total), 0)` }).from(orders)
        .where(and(eq(orders.sellerId, ctx.user.id), eq(orders.status, "completed"), gte(orders.createdAt, monthStart))),
      db.select({ count: sql<number>`count(distinct customer_id)` }).from(orders)
        .where(and(eq(orders.sellerId, ctx.user.id), ne(orders.customerId, 0))),
    ]);

    return {
      products: Number(myProducts[0]?.count ?? 0),
      orders: Number(myOrders[0]?.count ?? 0),
      revenueTotal: Number(myRevenue[0]?.sum ?? 0),
      revenueMonth: Number(myMonthRevenue[0]?.sum ?? 0),
      customers: Number(myCustomers[0]?.count ?? 0),
    };
  }),

  myOrders: adminQuery
    .input(z.object({
      status: z.enum(["pending", "processing", "completed", "cancelled", "refunded"]).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions: any[] = [eq(orders.sellerId, ctx.user.id)];
      if (input.status) conditions.push(eq(orders.status, input.status));

      const [items, countResult] = await Promise.all([
        db.query.orders.findMany({
          where: and(...conditions),
          with: { customer: true, items: { with: { product: true } } },
          orderBy: [desc(orders.createdAt)],
          limit: input.limit,
          offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(orders).where(and(...conditions)),
      ]);

      return { items, total: Number(countResult[0]?.count ?? 0), page: input.page, limit: input.limit };
    }),

  myCustomers: adminQuery
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const customerIds = await db.selectDistinct({ id: orders.customerId })
        .from(orders)
        .where(and(eq(orders.sellerId, ctx.user.id), ne(orders.customerId, 0)))
        .limit(input.limit)
        .offset(offset);

      const ids = customerIds.map(c => c.id).filter(Boolean) as number[];
      if (ids.length === 0) return { items: [], total: 0, page: input.page, limit: input.limit };

      const items = await db.query.users.findMany({
        where: inArray(users.id, ids),
      });

      return {
        items: items.map(({ passwordHash, twoFactorSecret, ...u }) => u),
        total: ids.length,
        page: input.page,
        limit: input.limit,
      };
    }),

  myRevenueChart: adminQuery
    .input(z.object({ days: z.number().int().min(7).max(365).default(30) }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      return db.select({
        date: sql<string>`DATE(created_at)`,
        revenue: sql<string>`COALESCE(SUM(total), 0)`,
        count: sql<number>`count(*)`,
      })
        .from(orders)
        .where(and(eq(orders.sellerId, ctx.user.id), eq(orders.status, "completed"), gte(orders.createdAt, since)))
        .groupBy(sql`DATE(created_at)`)
        .orderBy(sql`DATE(created_at)`);
    }),

  // ═══════════════════════════════════════════════════════════
  // AFFILIATE — Genehmigen / Ablehnen / Auszahlen
  // ═══════════════════════════════════════════════════════════

  approveAffiliate: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(affiliates).set({ status: "active" }).where(eq(affiliates.id, input.id));
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} approved affiliate ${input.id}`,
        metadata: { adminId: ctx.user.id, affiliateId: input.id },
      });
      return { success: true };
    }),

  rejectAffiliate: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(affiliates).set({ status: "inactive" }).where(eq(affiliates.id, input.id));
      await db.insert(systemLogs).values({
        level: "warn", category: "admin",
        message: `Admin ${ctx.user.id} rejected affiliate ${input.id}`,
        metadata: { adminId: ctx.user.id, affiliateId: input.id },
      });
      return { success: true };
    }),

  processAffiliatePayout: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const aff = await db.query.affiliates.findFirst({ where: eq(affiliates.id, input.id) });
      if (!aff) throw Errors.notFound("Affiliate nicht gefunden");
      const pending = Number(aff.pendingAmount ?? 0);
      await db.update(affiliates).set({
        totalPaid: sql`total_paid + ${pending}`,
        pendingAmount: "0",
      }).where(eq(affiliates.id, input.id));
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} processed payout of ${pending} for affiliate ${input.id}`,
        metadata: { adminId: ctx.user.id, affiliateId: input.id, amount: pending },
      });
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════
  // LOGS — Alias-Routen für Frontend-Kompatibilität
  // ═══════════════════════════════════════════════════════════

  getLogs: adminQuery
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(200).default(50),
      level: z.string().optional(),
      search: z.string().optional(),
      action: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions: any[] = [];
      if (input.level && input.level !== "all") conditions.push(eq(systemLogs.level, input.level as any));
      if (input.search) conditions.push(like(systemLogs.message, `%${input.search}%`));
      if (input.action) conditions.push(like(systemLogs.category, `%${input.action}%`));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const [items, countResult] = await Promise.all([
        db.query.systemLogs.findMany({
          where,
          orderBy: [desc(systemLogs.createdAt)],
          limit: input.limit,
          offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(systemLogs).where(where),
      ]);
      return {
        items: items.map(l => ({
          ...l,
          action: l.category,
          ipAddress: (l.metadata as any)?.ip ?? null,
          userId: (l.metadata as any)?.userId ?? null,
        })),
        total: Number(countResult[0]?.count ?? 0),
        page: input.page,
        limit: input.limit,
      };
    }),

  getSystemLogs: adminQuery
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ input }) => {
      const db = getDb();
      const items = await db.query.systemLogs.findMany({
        orderBy: [desc(systemLogs.createdAt)],
        limit: input.limit,
      });
      return { items };
    }),

  clearLogs: adminQuery
    .mutation(async ({ ctx }) => {
      const db = getDb();
      await db.delete(systemLogs);
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} cleared all system logs`,
        metadata: { adminId: ctx.user.id },
      });
      return { success: true };
    }),

  createBackup: adminQuery
    .mutation(async ({ ctx }) => {
      const db = getDb();
      const [userCount, orderCount, productCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(users),
        db.select({ count: sql<number>`count(*)` }).from(orders),
        db.select({ count: sql<number>`count(*)` }).from(products),
      ]);
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} triggered a backup`,
        metadata: {
          adminId: ctx.user.id,
          timestamp: new Date().toISOString(),
          snapshot: {
            users: Number(userCount[0]?.count ?? 0),
            orders: Number(orderCount[0]?.count ?? 0),
            products: Number(productCount[0]?.count ?? 0),
          },
        },
      });
      return {
        success: true,
        snapshot: {
          users: Number(userCount[0]?.count ?? 0),
          orders: Number(orderCount[0]?.count ?? 0),
          products: Number(productCount[0]?.count ?? 0),
          timestamp: new Date().toISOString(),
        },
      };
    }),

  // ═══════════════════════════════════════════════════════════
  // BLOCKLISTS — IP, E-Mail, Domain sperren
  // ═══════════════════════════════════════════════════════════

  listBlocklists: adminQuery
    .input(z.object({ type: z.enum(["ip", "email", "domain"]).optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const where = input.type ? eq(blocklists.type, input.type) : undefined;
      const items = await db.query.blocklists.findMany({
        where,
        orderBy: [desc(blocklists.createdAt)],
      });
      return items;
    }),

  addBlocklist: adminQuery
    .input(z.object({
      type: z.enum(["ip", "email", "domain"]),
      value: z.string().min(1).max(255),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(blocklists).values({
        type: input.type,
        value: input.value,
        reason: input.reason,
        createdBy: ctx.user.id,
      });
      await db.insert(systemLogs).values({
        level: "warn", category: "admin",
        message: `Admin ${ctx.user.id} added ${input.type} blocklist entry: ${input.value}`,
        metadata: { adminId: ctx.user.id, type: input.type, value: input.value },
      });
      return { success: true };
    }),

  deleteBlocklist: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.delete(blocklists).where(eq(blocklists.id, input.id));
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} removed blocklist entry ${input.id}`,
        metadata: { adminId: ctx.user.id, blocklistId: input.id },
      });
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════
  // BANNED WORDS — Wörter-Sperrliste für Shops und Produkte
  // ═══════════════════════════════════════════════════════════

  listBannedWords: adminQuery
    .input(z.object({ isActive: z.boolean().optional(), search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions: any[] = [];
      if (input?.isActive !== undefined) conditions.push(eq(bannedWords.isActive, input.isActive));
      if (input?.search) conditions.push(like(bannedWords.word, `%${input.search}%`));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      return db.query.bannedWords.findMany({
        where,
        orderBy: [desc(bannedWords.createdAt)],
      });
    }),

  addBannedWord: adminQuery
    .input(z.object({
      word: z.string().min(1).max(255),
      matchMode: z.enum(["exact", "contains"]).default("contains"),
      reason: z.string().optional(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const normalizedWord = input.word.trim().toLocaleLowerCase("de-DE");
      if (!normalizedWord) throw new Error("Bitte gib ein gültiges Sperrwort ein.");

      await db.insert(bannedWords).values({
        word: normalizedWord,
        matchMode: input.matchMode,
        reason: input.reason,
        isActive: input.isActive,
        createdBy: ctx.user.id,
      });

      await db.insert(systemLogs).values({
        level: "warn", category: "admin",
        message: `Admin ${ctx.user.id} added banned word: ${normalizedWord}`,
        metadata: { adminId: ctx.user.id, word: normalizedWord, matchMode: input.matchMode },
      });

      return { success: true };
    }),

  updateBannedWord: adminQuery
    .input(z.object({
      id: z.number().int().positive(),
      word: z.string().min(1).max(255).optional(),
      matchMode: z.enum(["exact", "contains"]).optional(),
      reason: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { id, word, ...rest } = input;
      const data: any = { ...rest };
      if (word !== undefined) data.word = word.trim().toLocaleLowerCase("de-DE");

      await db.update(bannedWords).set(data).where(eq(bannedWords.id, id));
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} updated banned word ${id}`,
        metadata: { adminId: ctx.user.id, bannedWordId: id },
      });

      return { success: true };
    }),

  deleteBannedWord: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.delete(bannedWords).where(eq(bannedWords.id, input.id));
      await db.insert(systemLogs).values({
        level: "info", category: "admin",
        message: `Admin ${ctx.user.id} removed banned word ${input.id}`,
        metadata: { adminId: ctx.user.id, bannedWordId: input.id },
      });
      return { success: true };
    }),
});
