import { z } from "zod";
import { eq, and, desc, sql, gte, ne } from "drizzle-orm";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  shops,
  products,
  orders,
  coupons,
  tickets,
  users,
  licenseKeys,
  productFiles,
  orderItems,
} from "@db/schema";

// ===================== SELLER ROUTER =====================
// Alle angemeldeten Nutzer können ihren eigenen Shop verwalten

export const sellerRouter = createRouter({

  // ── Shop Status ──────────────────────────────────────────────────────────────

  /** Gibt den Shop des aktuellen Nutzers zurück (oder null wenn keiner existiert) */
  getMyShop: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [shop] = await db
      .select()
      .from(shops)
      .where(eq(shops.ownerId, ctx.user.id))
      .limit(1);
    return shop ?? null;
  }),

  // ── Shop erstellen ────────────────────────────────────────────────────────────

  createShop: authedQuery
    .input(
      z.object({
        name: z.string().min(2).max(255),
        slug: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/, "Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt"),
        description: z.string().max(1000).optional(),
        category: z.string().optional(),
        logo: z.string().url().optional().or(z.literal("")),
        banner: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
    const db = getDb();
      // Nutzer-Limits aus DB lesen
      const [userLimits] = await db
        .select({
          shopLimit: users.shopLimit,
          subscriptionExpiresAt: users.subscriptionExpiresAt,
          isLifetimePremium: users.isLifetimePremium,
        })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      // Aktuelle Shop-Anzahl
      const [shopCountRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(shops)
        .where(eq(shops.ownerId, ctx.user.id));

      const currentShopCount = Number(shopCountRow?.count ?? 0);

      // Abo abgelaufen?
      const isExpired =
        !userLimits?.isLifetimePremium &&
        userLimits?.subscriptionExpiresAt !== null &&
        userLimits?.subscriptionExpiresAt !== undefined &&
        new Date(userLimits.subscriptionExpiresAt) < new Date();

      const effectiveShopLimit = isExpired ? 1 : (userLimits?.shopLimit ?? 1);

      // Shop-Limit prüfen (-1 = unbegrenzt)
      if (effectiveShopLimit !== -1 && currentShopCount >= effectiveShopLimit) {
        throw new Error(
          effectiveShopLimit === 1
            ? "Du hast dein Shop-Limit erreicht. Upgrade auf Premium um weitere Shops erstellen zu können."
            : `Du hast dein Shop-Limit von ${effectiveShopLimit} Shops erreicht. Upgrade auf einen höheren Tarif.`
        );
      }

      // Slug-Verfügbarkeit prüfen
      const [slugTaken] = await db
        .select({ id: shops.id })
        .from(shops)
        .where(eq(shops.slug, input.slug))
        .limit(1);

      if (slugTaken) {
        throw new Error("Diese Shop-URL ist bereits vergeben. Bitte wähle eine andere.");
      }

      const [newShop] = await db
        .insert(shops)
        .values({
          ownerId: ctx.user.id,
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          category: input.category ?? "general",
          logo: input.logo || null,
          banner: input.banner || null,
          status: "active",
        })
        .$returningId();

      // Nutzer-Rolle auf "seller" hochstufen wenn noch "customer"
      if (ctx.user.role === "customer") {
        await db
          .update(users)
          .set({ role: "seller" })
          .where(eq(users.id, ctx.user.id));
      }

      return { success: true, shopId: newShop.id, slug: input.slug };
    }),

  // ── Slug-Verfügbarkeit prüfen ─────────────────────────────────────────────────

  checkSlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [existing] = await db
        .select({ id: shops.id })
        .from(shops)
        .where(eq(shops.slug, input.slug))
        .limit(1);
      return { available: !existing };
    }),

  // ── Shop bearbeiten ───────────────────────────────────────────────────────────

  updateMyShop: authedQuery
    .input(
      z.object({
        name: z.string().min(2).max(255).optional(),
        description: z.string().max(1000).optional(),
        category: z.string().optional(),
        logo: z.string().optional(),
        banner: z.string().optional(),
        currency: z.string().length(3).optional(),
        status: z.enum(["active", "suspended"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
    const db = getDb();
      const [shop] = await db
        .select({ id: shops.id })
        .from(shops)
        .where(eq(shops.ownerId, ctx.user.id))
        .limit(1);

      if (!shop) throw new Error("Kein Shop gefunden.");

      await db
        .update(shops)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.category !== undefined && { category: input.category }),
          ...(input.logo !== undefined && { logo: input.logo || null }),
          ...(input.banner !== undefined && { banner: input.banner || null }),
          ...(input.currency !== undefined && { currency: input.currency }),
          ...(input.status !== undefined && { status: input.status }),
        })
        .where(eq(shops.id, shop.id));

      return { success: true };
    }),

  // ── Shop-Statistiken ──────────────────────────────────────────────────────────

  getStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [shop] = await db
      .select()
      .from(shops)
      .where(eq(shops.ownerId, ctx.user.id))
      .limit(1);

    if (!shop) return null;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [myProducts, myOrders, myRevenue, myMonthRevenue, myCustomers] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.sellerId, ctx.user.id)),
      db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.sellerId, ctx.user.id)),
      db
        .select({ sum: sql<string>`coalesce(sum(total), 0)` })
        .from(orders)
        .where(and(eq(orders.sellerId, ctx.user.id), eq(orders.status, "completed"))),
      db
        .select({ sum: sql<string>`coalesce(sum(total), 0)` })
        .from(orders)
        .where(and(eq(orders.sellerId, ctx.user.id), eq(orders.status, "completed"), gte(orders.createdAt, monthStart))),
      db
        .select({ count: sql<number>`count(distinct customer_id)` })
        .from(orders)
        .where(and(eq(orders.sellerId, ctx.user.id), ne(orders.customerId, 0))),
    ]);

    return {
      shop,
      products: Number(myProducts[0]?.count ?? 0),
      orders: Number(myOrders[0]?.count ?? 0),
      revenueTotal: Number(myRevenue[0]?.sum ?? 0),
      revenueMonth: Number(myMonthRevenue[0]?.sum ?? 0),
      customers: Number(myCustomers[0]?.count ?? 0),
    };
  }),

  // ── Umsatz-Chart ─────────────────────────────────────────────────────────────

  getRevenueChart: authedQuery
    .input(z.object({ days: z.number().int().min(7).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
    const db = getDb();
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const rows = await db
        .select({
          date: sql<string>`DATE(created_at)`,
          revenue: sql<string>`coalesce(sum(total), 0)`,
          orders: sql<number>`count(*)`,
        })
        .from(orders)
        .where(and(eq(orders.sellerId, ctx.user.id), eq(orders.status, "completed"), gte(orders.createdAt, since)))
        .groupBy(sql`DATE(created_at)`)
        .orderBy(sql`DATE(created_at)`);

      return rows.map((r) => ({
        date: r.date,
        revenue: Number(r.revenue),
        orders: Number(r.orders),
      }));
    }),

  // ── Produkte ─────────────────────────────────────────────────────────────────

  getProducts: authedQuery
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        status: z.enum(["active", "inactive", "draft"]).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
    const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions = [eq(products.sellerId, ctx.user.id)];
      if (input.status) conditions.push(eq(products.status, input.status));

      const [rows, total] = await Promise.all([
        db
          .select()
          .from(products)
          .where(and(...conditions))
          .orderBy(desc(products.createdAt))
          .limit(input.limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(and(...conditions)),
      ]);

      return { items: rows, total: Number(total[0]?.count ?? 0), page: input.page, limit: input.limit };
    }),

  createProduct: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        shortDescription: z.string().max(500).optional(),
        price: z.number().min(0),
        type: z.enum(["file", "license", "service", "subscription"]).default("file"),
        categoryId: z.number().int().positive().optional(),
        stock: z.number().int().default(-1),
        status: z.enum(["active", "inactive", "draft"]).default("draft"),
        tags: z.array(z.string()).optional(),
        taxRate: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
    const db = getDb();
      // Shop muss existieren
      const [shop] = await db
        .select({ id: shops.id })
        .from(shops)
        .where(eq(shops.ownerId, ctx.user.id))
        .limit(1);
      if (!shop) throw new Error("Erstelle zuerst einen Shop.");

      const slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 200) + "-" + Date.now().toString(36);

      const [newProduct] = await db
        .insert(products)
        .values({
          name: input.name,
          slug,
          description: input.description ?? null,
          shortDescription: input.shortDescription ?? null,
          price: String(input.price),
          type: input.type,
          categoryId: input.categoryId ?? null,
          sellerId: ctx.user.id,
          stock: input.stock,
          status: input.status,
          tags: input.tags ?? [],
          taxRate: input.taxRate ? String(input.taxRate) : "0",
        })
        .$returningId();

      return { success: true, productId: newProduct.id };
    }),

  updateProduct: authedQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        shortDescription: z.string().max(500).optional(),
        price: z.number().min(0).optional(),
        type: z.enum(["file", "license", "service", "subscription"]).optional(),
        stock: z.number().int().optional(),
        status: z.enum(["active", "inactive", "draft"]).optional(),
        tags: z.array(z.string()).optional(),
        taxRate: z.number().min(0).max(100).optional(),
        image: z.string().optional(),
        fileUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
    const db = getDb();
      const [product] = await db
        .select({ id: products.id, sellerId: products.sellerId })
        .from(products)
        .where(and(eq(products.id, input.id), eq(products.sellerId, ctx.user.id)))
        .limit(1);

      if (!product) throw new Error("Produkt nicht gefunden oder kein Zugriff.");

      const { id, ...updateData } = input;
      await db
        .update(products)
        .set({
          ...(updateData.name !== undefined && { name: updateData.name }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.shortDescription !== undefined && { shortDescription: updateData.shortDescription }),
          ...(updateData.price !== undefined && { price: String(updateData.price) }),
          ...(updateData.type !== undefined && { type: updateData.type }),
          ...(updateData.stock !== undefined && { stock: updateData.stock }),
          ...(updateData.status !== undefined && { status: updateData.status }),
          ...(updateData.tags !== undefined && { tags: updateData.tags }),
          ...(updateData.taxRate !== undefined && { taxRate: String(updateData.taxRate) }),
          ...(updateData.image !== undefined && { image: updateData.image }),
          ...(updateData.fileUrl !== undefined && { fileUrl: updateData.fileUrl }),
        })
        .where(eq(products.id, id));

      return { success: true };
    }),

  deleteProduct: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
    const db = getDb();
      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.id, input.id), eq(products.sellerId, ctx.user.id)))
        .limit(1);

      if (!product) throw new Error("Produkt nicht gefunden oder kein Zugriff.");

      await db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),

  // ── Lizenzschlüssel ───────────────────────────────────────────────────────────

  addLicenseKeys: authedQuery
    .input(
      z.object({
        productId: z.number().int().positive(),
        keys: z.array(z.string().min(1)).min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
    const db = getDb();
      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.id, input.productId), eq(products.sellerId, ctx.user.id)))
        .limit(1);

      if (!product) throw new Error("Produkt nicht gefunden oder kein Zugriff.");

      await db.insert(licenseKeys).values(
        input.keys.map((key) => ({
          productId: input.productId,
          key,
          status: "available" as const,
        }))
      );

      return { success: true, added: input.keys.length };
    }),

  // ── Lizenzkeys abrufen ────────────────────────────────────────────────────────

  getProductKeys: authedQuery
    .input(z.object({ productId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
    const db = getDb();
      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.id, input.productId), eq(products.sellerId, ctx.user.id)))
        .limit(1);
      if (!product) throw new Error("Produkt nicht gefunden.");
      return db.select().from(licenseKeys).where(eq(licenseKeys.productId, input.productId)).orderBy(desc(licenseKeys.createdAt));
    }),

  // ── Lizenzkey löschen ─────────────────────────────────────────────────────────

  deleteKey: authedQuery
    .input(z.object({ keyId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
    const db = getDb();
      const [keyRow] = await db
        .select({ id: licenseKeys.id, productId: licenseKeys.productId })
        .from(licenseKeys)
        .where(eq(licenseKeys.id, input.keyId))
        .limit(1);
      if (!keyRow) throw new Error("Key nicht gefunden.");
      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.id, keyRow.productId), eq(products.sellerId, ctx.user.id)))
        .limit(1);
      if (!product) throw new Error("Kein Zugriff.");
      await db.delete(licenseKeys).where(eq(licenseKeys.id, input.keyId));
      return { success: true };
    }),

  // ── Produktdatei hinzufügen ───────────────────────────────────────────────────

  addProductFile: authedQuery
    .input(z.object({
      productId: z.number().int().positive(),
      name: z.string().min(1),
      url: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
    const db = getDb();
      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.id, input.productId), eq(products.sellerId, ctx.user.id)))
        .limit(1);
      if (!product) throw new Error("Produkt nicht gefunden.");
      await db.insert(productFiles).values({ productId: input.productId, name: input.name, url: input.url });
      return { success: true };
    }),

  // ── Produktdateien abrufen ────────────────────────────────────────────────────

  getProductFiles: authedQuery
    .input(z.object({ productId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
    const db = getDb();
      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.id, input.productId), eq(products.sellerId, ctx.user.id)))
        .limit(1);
      if (!product) throw new Error("Produkt nicht gefunden.");
      return db.select().from(productFiles).where(eq(productFiles.productId, input.productId));
    }),

  // ── Produktdatei löschen ──────────────────────────────────────────────────────

  deleteProductFile: authedQuery
    .input(z.object({ fileId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
    const db = getDb();
      const [file] = await db
        .select({ id: productFiles.id, productId: productFiles.productId })
        .from(productFiles)
        .where(eq(productFiles.id, input.fileId))
        .limit(1);
      if (!file) throw new Error("Datei nicht gefunden.");
      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.id, file.productId), eq(products.sellerId, ctx.user.id)))
        .limit(1);
      if (!product) throw new Error("Kein Zugriff.");
      await db.delete(productFiles).where(eq(productFiles.id, input.fileId));
      return { success: true };
    }),

  // ── Öffentliche Shop-Seite ────────────────────────────────────────────────────

  getPublicShop: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
    const db = getDb();
      const [shop] = await db
        .select()
        .from(shops)
        .where(and(eq(shops.slug, input.slug), eq(shops.status, "active")))
        .limit(1);
      if (!shop) return null;
      const shopProducts = await db
        .select()
        .from(products)
        .where(and(eq(products.sellerId, shop.ownerId), eq(products.status, "active"), eq(products.visibility, "public")))
        .orderBy(desc(products.createdAt));
      return { shop, products: shopProducts };
    }),

  // ── Bestellungen ─────────────────────────────────────────────────────────────

  getOrders: authedQuery
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        status: z.enum(["pending", "paid", "completed", "cancelled", "refunded"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
    const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const conditions = [eq(orders.sellerId, ctx.user.id)];
      if (input.status) conditions.push(eq(orders.status, input.status));

      const [rows, total] = await Promise.all([
        db
          .select()
          .from(orders)
          .where(and(...conditions))
          .orderBy(desc(orders.createdAt))
          .limit(input.limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(orders)
          .where(and(...conditions)),
      ]);

      return { items: rows, total: Number(total[0]?.count ?? 0), page: input.page, limit: input.limit };
    }),

  // ── Kunden ───────────────────────────────────────────────────────────────────

  getCustomers: authedQuery
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
    const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const rows = await db
        .select({
          customerId: orders.customerId,
          customerEmail: orders.customerEmail,
          customerName: orders.customerName,
          orderCount: sql<number>`count(*)`,
          totalSpent: sql<string>`coalesce(sum(total), 0)`,
          lastOrder: sql<string>`max(${orders.createdAt})`,
        })
        .from(orders)
        .where(and(eq(orders.sellerId, ctx.user.id), ne(orders.customerId, 0)))
        .groupBy(orders.customerId, orders.customerEmail, orders.customerName)
        .orderBy(desc(sql`max(${orders.createdAt})`))
        .limit(input.limit)
        .offset(offset);

      const [total] = await db
        .select({ count: sql<number>`count(distinct customer_id)` })
        .from(orders)
        .where(and(eq(orders.sellerId, ctx.user.id), ne(orders.customerId, 0)));

      return {
        items: rows.map((r) => ({
          customerId: r.customerId,
          email: r.customerEmail,
          name: r.customerName,
          orderCount: Number(r.orderCount),
          totalSpent: Number(r.totalSpent),
          lastOrder: r.lastOrder,
        })),
        total: Number(total?.count ?? 0),
        page: input.page,
        limit: input.limit,
      };
    }),

  // ── Zahlungen ─────────────────────────────────────────────────────────────────

  getPayments: authedQuery
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
    const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const [rows, total] = await Promise.all([
        db
          .select()
          .from(orders)
          .where(and(eq(orders.sellerId, ctx.user.id), eq(orders.paymentStatus, "succeeded")))
          .orderBy(desc(orders.createdAt))
          .limit(input.limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(orders)
          .where(and(eq(orders.sellerId, ctx.user.id), eq(orders.paymentStatus, "succeeded"))),
      ]);

      return { items: rows, total: Number(total[0]?.count ?? 0), page: input.page, limit: input.limit };
    }),

  // ── Gutscheine ────────────────────────────────────────────────────────────────

  getCoupons: authedQuery
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
    const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const [rows, total] = await Promise.all([
        db
          .select()
          .from(coupons)
          .where(eq(coupons.createdBy, ctx.user.id))
          .orderBy(desc(coupons.createdAt))
          .limit(input.limit)
          .offset(offset),
      db
          .select({ count: sql<number>`count(*)` })
          .from(coupons)
          .where(eq(coupons.createdBy, ctx.user.id)),
      ]);

      return { items: rows, total: Number(total[0]?.count ?? 0), page: input.page, limit: input.limit };
    }),

  createCoupon: authedQuery
    .input(
      z.object({
        code: z.string().min(3).max(50).toUpperCase(),
        type: z.enum(["percentage", "fixed"]),
        value: z.number().positive(),
        minOrderAmount: z.number().min(0).optional(),
        maxUses: z.number().int().positive().optional(),
        expiresAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
    const db = getDb();
      await db.insert(coupons).values({
        code: input.code.toUpperCase(),
        type: input.type,
        value: String(input.value),
        minOrderAmount: input.minOrderAmount ? String(input.minOrderAmount) : null,
        maxUses: input.maxUses ?? null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        createdBy: ctx.user.id,
        isActive: true,
      });
      return { success: true };
    }),

  deleteCoupon: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
    const db = getDb();
      await db
        .delete(coupons)
        .where(and(eq(coupons.id, input.id), eq(coupons.createdBy, ctx.user.id)));
      return { success: true };
    }),

  // ── Tickets ───────────────────────────────────────────────────────────────────

  getTickets: authedQuery
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
    const db = getDb();
      const offset = (input.page - 1) * input.limit;

      // Tickets, bei denen der Seller der Empfänger ist (Kunden-Tickets für seine Produkte)
      const [rows, total] = await Promise.all([
        db
          .select()
          .from(tickets)
          .where(eq(tickets.sellerId, ctx.user.id))
          .orderBy(desc(tickets.createdAt))
          .limit(input.limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(tickets)
          .where(eq(tickets.sellerId, ctx.user.id)),
      ]);

      return { items: rows, total: Number(total[0]?.count ?? 0), page: input.page, limit: input.limit };
    }),

  // ── Analytics ─────────────────────────────────────────────────────────────────

  getAnalytics: authedQuery
    .input(z.object({ days: z.number().int().min(7).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
    const db = getDb();
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const [revenueByDay, topProducts, statusBreakdown] = await Promise.all([
        db
          .select({
            date: sql<string>`DATE(created_at)`,
            revenue: sql<string>`coalesce(sum(total), 0)`,
            orders: sql<number>`count(*)`,
          })
          .from(orders)
          .where(and(eq(orders.sellerId, ctx.user.id), gte(orders.createdAt, since)))
          .groupBy(sql`DATE(created_at)`)
          .orderBy(sql`DATE(created_at)`),

        db
          .select({
            productId: orderItems.productId,
            productName: orderItems.productName,
            totalSold: sql<number>`sum(quantity)`,
            totalRevenue: sql<string>`coalesce(sum(total_price), 0)`,
          })
          .from(orderItems)
          .innerJoin(orders, eq(orderItems.orderId, orders.id))
          .where(and(eq(orders.sellerId, ctx.user.id), gte(orders.createdAt, since)))
          .groupBy(orderItems.productId, orderItems.productName)
          .orderBy(desc(sql`sum(total_price)`))
          .limit(5),

        db
          .select({
            status: orders.status,
            count: sql<number>`count(*)`,
          })
          .from(orders)
          .where(eq(orders.sellerId, ctx.user.id))
          .groupBy(orders.status),
      ]);

      return {
        revenueByDay: revenueByDay.map((r) => ({
          date: r.date,
          revenue: Number(r.revenue),
          orders: Number(r.orders),
        })),
        topProducts: topProducts.map((p) => ({
          productId: p.productId,
          name: p.productName,
          sold: Number(p.totalSold),
          revenue: Number(p.totalRevenue),
        })),
        statusBreakdown: statusBreakdown.map((s) => ({
          status: s.status,
          count: Number(s.count),
        })),
      };
    }),
});
