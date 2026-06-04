import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  orders, orderItems, products, licenseKeys, coupons,
  productFiles, paymentLogs, deliveryLogs,
} from "@db/schema";
import { Errors } from "@contracts/errors";

function generateOrderNumber(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export const orderRouter = createRouter({
  // ── Create order ──────────────────────────────────────────────────────────
  create: publicQuery
    .input(z.object({
      customerEmail: z.string().email(),
      customerName: z.string().optional(),
      items: z.array(z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).default(1),
      })),
      paymentMethod: z.enum(["stripe", "paypal", "crypto"]),
      couponCode: z.string().optional(),
      sessionId: z.string().optional(),
      customerId: z.number().int().positive().optional(),
      // Billing / invoice data
      billingName: z.string().max(255).optional(),
      billingEmail: z.string().email().optional(),
      billingAddress: z.string().max(500).optional(),
      billingCity: z.string().max(100).optional(),
      billingCountry: z.string().max(100).optional(),
      billingZip: z.string().max(20).optional(),
      billingVatId: z.string().max(50).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // ── Calculate totals ──
      let subtotal = 0;
      const orderItemsData: Array<{
        productId: number; productName: string;
        quantity: number; unitPrice: string; totalPrice: string;
        taxRate: string; taxAmount: string;
      }> = [];

      for (const item of input.items) {
        const product = await db.query.products.findFirst({ where: eq(products.id, item.productId) });
        if (!product) throw Errors.notFound(`Produkt ${item.productId} nicht gefunden.`);
        if (product.status !== "active") throw Errors.badRequest(`Produkt "${product.name}" ist nicht verfügbar.`);
        if (product.stock !== -1 && product.stock < item.quantity) throw Errors.badRequest(`Nicht genug Lagerbestand für "${product.name}".`);

        const price = parseFloat(product.price);
        const taxRate = parseFloat(product.taxRate ?? "0");
        const taxIncluded = product.taxIncluded ?? false;
        let netPrice = price;
        let taxAmount = 0;

        if (taxIncluded) {
          netPrice = price / (1 + taxRate / 100);
          taxAmount = price - netPrice;
        } else {
          taxAmount = price * (taxRate / 100);
        }

        const totalPrice = (price + (taxIncluded ? 0 : taxAmount)) * item.quantity;
        subtotal += totalPrice;

        orderItemsData.push({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: price.toFixed(2),
          totalPrice: totalPrice.toFixed(2),
          taxRate: taxRate.toFixed(2),
          taxAmount: (taxAmount * item.quantity).toFixed(2),
        });
      }

      // ── Apply coupon ──
      let discount = 0;
      let couponId: number | null = null;
      if (input.couponCode) {
        const coupon = await db.query.coupons.findFirst({
          where: and(eq(coupons.code, input.couponCode), eq(coupons.isActive, true)),
        });
        if (coupon) {
          if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) throw Errors.badRequest("Gutschein ist abgelaufen.");
          if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw Errors.badRequest("Gutschein-Limit erreicht.");
          const couponValue = parseFloat(coupon.value);
          discount = coupon.type === "percentage" ? subtotal * (couponValue / 100) : Math.min(couponValue, subtotal);
          couponId = coupon.id;
          await db.update(coupons).set({ usedCount: sql`used_count + 1` }).where(eq(coupons.id, coupon.id));
        }
      }

      const total = Math.max(0, subtotal - discount);
      const fee = total * 0.05; // 5% platform fee

      // ── Create order ──
      const orderNumber = generateOrderNumber();
      const result = await db.insert(orders).values({
        orderNumber,
        customerId: input.customerId ?? null,
        customerEmail: input.customerEmail,
        customerName: input.customerName ?? null,
        total: total.toFixed(2),
        subtotal: subtotal.toFixed(2),
        fee: fee.toFixed(2),
        paymentMethod: input.paymentMethod,
        couponCode: input.couponCode ?? null,
        couponId: couponId ?? undefined,
        discount: discount.toFixed(2),
        billingName: input.billingName ?? null,
        billingEmail: input.billingEmail ?? null,
        billingAddress: input.billingAddress ?? null,
        billingCity: input.billingCity ?? null,
        billingCountry: input.billingCountry ?? null,
        billingZip: input.billingZip ?? null,
        billingVatId: input.billingVatId ?? null,
      });

      const orderId = Number(result[0].insertId);

      // ── Create order items + fulfillment ──
      for (const itemData of orderItemsData) {
        const product = await db.query.products.findFirst({
          where: eq(products.id, itemData.productId),
          with: { files: true },
        });

        const itemResult = await db.insert(orderItems).values({
          orderId,
          productId: itemData.productId,
          productName: itemData.productName,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          totalPrice: itemData.totalPrice,
          taxRate: itemData.taxRate,
          taxAmount: itemData.taxAmount,
          downloadLimit: product?.downloadLimit ?? -1,
        });
        const orderItemId = Number(itemResult[0].insertId);

        // ── License key fulfillment ──
        if (product?.type === "license") {
          const availableKey = await db.query.licenseKeys.findFirst({
            where: and(eq(licenseKeys.productId, itemData.productId), eq(licenseKeys.status, "available")),
          });
          if (availableKey) {
            await db.update(licenseKeys).set({ status: "sold", orderId, soldAt: new Date() }).where(eq(licenseKeys.id, availableKey.id));
            await db.update(orderItems).set({ licenseKey: availableKey.key }).where(eq(orderItems.id, orderItemId));
            // Delivery log
            await db.insert(deliveryLogs).values({
              orderId, orderItemId, type: "license_key",
              status: "delivered", deliveredAt: new Date(),
              details: JSON.stringify({ keyId: availableKey.id }),
            }).catch(() => {});
          } else {
            // No key available — log as pending
            await db.insert(deliveryLogs).values({
              orderId, orderItemId, type: "license_key", status: "pending",
              details: JSON.stringify({ reason: "no_keys_available" }),
            }).catch(() => {});
          }
        }

        // ── File fulfillment (multi-file support) ──
        if (product?.type === "file") {
          if (product.files && product.files.length > 0) {
            // Use productFiles table (multi-file)
            await db.update(orderItems).set({ fileUrl: product.files[0].url }).where(eq(orderItems.id, orderItemId));
          } else if (product.fileUrl) {
            // Fallback to legacy single fileUrl
            await db.update(orderItems).set({ fileUrl: product.fileUrl }).where(eq(orderItems.id, orderItemId));
          }
          await db.insert(deliveryLogs).values({
            orderId, orderItemId, type: "file",
            status: "delivered", deliveredAt: new Date(),
            details: JSON.stringify({ fileCount: product.files?.length ?? 1 }),
          }).catch(() => {});
        }

        // ── Service fulfillment ──
        if (product?.type === "service") {
          await db.insert(deliveryLogs).values({
            orderId, orderItemId, type: "service",
            status: "pending",
            details: JSON.stringify({ message: "Manuelle Bearbeitung erforderlich." }),
          }).catch(() => {});
        }

        // ── Stock update ──
        if (product && product.stock !== -1) {
          await db.update(products).set({
            stock: sql`stock - ${itemData.quantity}`,
            soldCount: sql`sold_count + ${itemData.quantity}`,
          }).where(eq(products.id, itemData.productId));
        } else if (product) {
          await db.update(products).set({ soldCount: sql`sold_count + ${itemData.quantity}` }).where(eq(products.id, itemData.productId));
        }
      }

      // ── Payment log (pending) ──
      await db.insert(paymentLogs).values({
        orderId,
        provider: input.paymentMethod,
        amount: total.toFixed(2),
        currency: "EUR",
        status: "pending",
        metadata: JSON.stringify({ orderNumber }),
      }).catch(() => {});

      return { orderId, orderNumber, total: total.toFixed(2) };
    }),

  // ── Update status ──────────────────────────────────────────────────────────
  updateStatus: adminQuery
    .input(z.object({
      orderId: z.number().int().positive(),
      status: z.enum(["pending", "paid", "completed", "cancelled", "refunded"]),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(orders).set({ status: input.status, updatedAt: new Date() }).where(eq(orders.id, input.orderId));

      // Update payment log
      if (input.status === "paid" || input.status === "completed") {
        await db.update(paymentLogs)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(paymentLogs.orderId, input.orderId));
      }
      return { success: true };
    }),

  // ── Refund ────────────────────────────────────────────────────────────────
  refund: adminQuery
    .input(z.object({
      orderId: z.number().int().positive(),
      reason: z.string().max(500).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const order = await db.query.orders.findFirst({ where: eq(orders.id, input.orderId) });
      if (!order) throw Errors.notFound("Bestellung nicht gefunden.");
      if (order.status === "refunded") throw Errors.badRequest("Bestellung wurde bereits erstattet.");

      await db.update(orders).set({ status: "refunded", paymentStatus: "refunded", updatedAt: new Date() }).where(eq(orders.id, input.orderId));

      // Log refund
      await db.insert(paymentLogs).values({
        orderId: input.orderId,
        provider: order.paymentMethod ?? "manual",
        amount: order.total,
        currency: "EUR",
        status: "refunded",
        metadata: JSON.stringify({ reason: input.reason ?? "admin_refund", originalOrderNumber: order.orderNumber }),
      }).catch(() => {});

      return { success: true };
    }),

  // ── Get by customer ───────────────────────────────────────────────────────
  getByCustomer: authedQuery
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(10),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      const offset = (page - 1) * limit;
      const [items, countResult] = await Promise.all([
        db.query.orders.findMany({
          where: eq(orders.customerId, ctx.user.id),
          orderBy: [desc(orders.createdAt)],
          limit, offset,
          with: { items: { with: { product: true } } },
        }),
        db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.customerId, ctx.user.id)),
      ]);
      return { items, page, total: Number(countResult[0]?.count ?? 0) };
    }),

  // ── Get order detail ──────────────────────────────────────────────────────
  getById: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, input.id),
        with: { items: { with: { product: true } }, deliveryLogs: true },
      });
      if (!order) throw Errors.notFound("Bestellung nicht gefunden.");
      if (order.customerId !== ctx.user.id && ctx.user.role !== "admin") throw Errors.forbidden("Kein Zugriff.");
      return order;
    }),

  // ── Admin: list all orders ────────────────────────────────────────────────
  adminList: adminQuery
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["pending", "paid", "completed", "cancelled", "refunded"]).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const offset = (page - 1) * limit;
      const conditions = [];
      if (input?.status) conditions.push(eq(orders.status, input.status));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const [items, countResult] = await Promise.all([
        db.query.orders.findMany({ where, orderBy: [desc(orders.createdAt)], limit, offset, with: { items: true } }),
        db.select({ count: sql<number>`count(*)` }).from(orders).where(where),
      ]);
      return { items, total: Number(countResult[0]?.count ?? 0), page };
    }),

  // ── Get delivery logs ─────────────────────────────────────────────────────
  deliveryLogs: authedQuery
    .input(z.object({ orderId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const order = await db.query.orders.findFirst({ where: eq(orders.id, input.orderId) });
      if (!order) throw Errors.notFound("Bestellung nicht gefunden.");
      if (order.customerId !== ctx.user.id && ctx.user.role !== "admin") throw Errors.forbidden("Kein Zugriff.");
      return db.query.deliveryLogs.findMany({ where: eq(deliveryLogs.orderId, input.orderId), orderBy: (l, { desc }) => [desc(l.createdAt)] });
    }),

  // ── Get files for purchased product ──────────────────────────────────────
  getPurchasedFiles: authedQuery
    .input(z.object({ orderItemId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const item = await db.query.orderItems.findFirst({
        where: eq(orderItems.id, input.orderItemId),
        with: { order: true, product: { with: { files: true } } },
      });
      if (!item || !item.order) throw Errors.notFound("Bestellposition nicht gefunden.");
      if (item.order.customerId !== ctx.user.id) throw Errors.forbidden("Kein Zugriff.");
      if (!["paid", "completed"].includes(item.order.status)) throw Errors.forbidden("Bestellung nicht abgeschlossen.");
      return item.product?.files ?? [];
    }),
});
