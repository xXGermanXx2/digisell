import { z } from "zod";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, orderItems, paymentLogs, shopSettings } from "@db/schema";
import { Errors } from "@contracts/errors";
import { generateInvoiceHtml } from "./lib/invoice-pdf";

export const invoiceRouter = createRouter({
  // ── Get invoice HTML for an order ────────────────────────────────────────
  getInvoice: authedQuery
    .input(z.object({ orderId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
        with: { items: true },
      });
      if (!order) throw Errors.notFound("Bestellung nicht gefunden.");
      if (order.customerId !== ctx.user.id && ctx.user.role !== "admin") throw Errors.forbidden("Kein Zugriff.");
      if (!["paid", "completed"].includes(order.status)) throw Errors.badRequest("Rechnung nur für bezahlte Bestellungen verfügbar.");

      const settings = await db.query.shopSettings.findFirst();

      const html = generateInvoiceHtml({
        orderNumber: order.orderNumber,
        createdAt: order.createdAt ?? new Date(),
        billingName: order.billingName,
        billingEmail: order.billingEmail,
        billingAddress: order.billingAddress,
        billingCity: order.billingCity,
        billingZip: order.billingZip,
        billingCountry: order.billingCountry,
        billingVatId: order.billingVatId,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        items: order.items.map(i => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          taxRate: i.taxRate,
          taxAmount: null,
        })),
        subtotal: order.subtotal,
        discount: order.discount,
        taxAmount: order.taxAmount,
        fee: order.fee,
        total: order.total,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        shopName: settings?.shopName,
        shopEmail: settings?.smtpFrom,
      });

      return { html, orderNumber: order.orderNumber };
    }),

  // ── Payment logs (admin) ──────────────────────────────────────────────────
  paymentLogs: adminQuery
    .input(z.object({
      orderId: z.number().int().positive().optional(),
      provider: z.enum(["stripe", "paypal", "crypto", "system"]).optional(),
      status: z.enum(["success", "failed", "pending", "completed", "refunded"]).optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (input?.orderId) conditions.push(eq(paymentLogs.orderId, input.orderId));
      if (input?.provider) conditions.push(eq(paymentLogs.provider, input.provider));
      if (input?.status) conditions.push(eq(paymentLogs.status, input.status as any));
      if (input?.dateFrom) conditions.push(gte(paymentLogs.createdAt, new Date(input.dateFrom)));
      if (input?.dateTo) conditions.push(lte(paymentLogs.createdAt, new Date(input.dateTo)));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        db.query.paymentLogs.findMany({
          where,
          with: { order: true },
          orderBy: [desc(paymentLogs.createdAt)],
          limit, offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(paymentLogs).where(where),
      ]);

      return { items, total: Number(countResult[0]?.count ?? 0), page };
    }),

  // ── Payment summary stats (admin) ─────────────────────────────────────────
  paymentStats: adminQuery
    .query(async () => {
      const db = getDb();
      const [total, succeeded, failed, pending, refunded] = await Promise.all([
        db.select({ count: sql<number>`count(*)`, sum: sql<string>`COALESCE(SUM(amount), 0)` }).from(paymentLogs),
        db.select({ count: sql<number>`count(*)` }).from(paymentLogs).where(eq(paymentLogs.status, "completed" as any)),
        db.select({ count: sql<number>`count(*)` }).from(paymentLogs).where(eq(paymentLogs.status, "failed")),
        db.select({ count: sql<number>`count(*)` }).from(paymentLogs).where(eq(paymentLogs.status, "pending")),
        db.select({ count: sql<number>`count(*)` }).from(paymentLogs).where(eq(paymentLogs.status, "refunded" as any)),
      ]);
      return {
        total: Number(total[0]?.count ?? 0),
        totalVolume: total[0]?.sum ?? "0",
        succeeded: Number(succeeded[0]?.count ?? 0),
        failed: Number(failed[0]?.count ?? 0),
        pending: Number(pending[0]?.count ?? 0),
        refunded: Number(refunded[0]?.count ?? 0),
      };
    }),
});
