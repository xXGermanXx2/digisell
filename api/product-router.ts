import { z } from "zod";
import { eq, like, and, or, desc, sql, asc } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { products, categories, licenseKeys, productVariants, productFiles } from "@db/schema";
import { Errors } from "@contracts/errors";

export const productRouter = createRouter({
  list: publicQuery
    .input(z.object({
      search: z.string().optional(),
      category: z.string().optional(),
      categoryId: z.number().int().optional(),
      type: z.enum(["file", "license", "service", "subscription"]).optional(),
      sort: z.enum(["newest", "oldest", "price_asc", "price_desc", "popular"]).optional().default("newest"),
      status: z.enum(["active", "inactive", "draft"]).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const i = input ?? {};
      const offset = ((i.page ?? 1) - 1) * (i.limit ?? 20);
      const conditions = [];
      if (!i.status) conditions.push(eq(products.status, "active"));
      else conditions.push(eq(products.status, i.status));
      if (i.search) conditions.push(or(like(products.name, `%${i.search}%`), like(products.description, `%${i.search}%`)));
      if (i.type) conditions.push(eq(products.type, i.type));
      if (i.categoryId) conditions.push(eq(products.categoryId, i.categoryId));
      if (i.category) {
        const cat = await db.query.categories.findFirst({ where: eq(categories.slug, i.category) });
        if (cat) conditions.push(eq(products.categoryId, cat.id));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const orderMap: Record<string, any> = {
        newest: desc(products.createdAt), oldest: asc(products.createdAt),
        price_asc: asc(products.price), price_desc: desc(products.price), popular: desc(products.soldCount),
      };
      const [items, countResult] = await Promise.all([
        db.query.products.findMany({ where, with: { category: true, variants: true }, orderBy: [orderMap[i.sort ?? "newest"]], limit: i.limit ?? 20, offset }),
        db.select({ count: sql<number>`count(*)` }).from(products).where(where),
      ]);
      return { items, total: Number(countResult[0]?.count ?? 0), page: i.page ?? 1, limit: i.limit ?? 20, totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / (i.limit ?? 20)) };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const product = await db.query.products.findFirst({ where: eq(products.id, input.id), with: { category: true, variants: true } });
      return product ?? null;
    }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const product = await db.query.products.findFirst({ where: eq(products.slug, input.slug), with: { category: true, variants: true, files: true } });
      if (!product) throw Errors.notFound("Produkt nicht gefunden.");
      const { fileUrl, ...safe } = product;
      return { ...safe, hasFile: !!fileUrl };
    }),

  getFeatured: publicQuery
    .input(z.object({ limit: z.number().int().min(1).max(20).default(8) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.products.findMany({ where: and(eq(products.status, "active"), eq(products.visibility, "public")), with: { category: true }, orderBy: [desc(products.soldCount)], limit: input?.limit ?? 8 });
    }),

  create: adminQuery
    .input(z.object({
      name: z.string().min(1).max(255),
      slug: z.string().min(1).max(255),
      description: z.string().optional(),
      shortDescription: z.string().max(500).optional(),
      price: z.string(),
      compareAtPrice: z.string().optional(),
      categoryId: z.number().int().positive().optional(),
      type: z.enum(["file", "license", "service", "subscription"]).default("file"),
      image: z.string().max(500).optional(),
      fileUrl: z.string().max(500).optional(),
      fileSize: z.string().max(50).optional(),
      downloadLimit: z.number().int().default(-1),
      stock: z.number().int().default(-1),
      status: z.enum(["active", "inactive", "draft"]).default("draft"),
      visibility: z.enum(["public", "private"]).default("public"),
      tags: z.array(z.string()).optional(),
      taxRate: z.string().optional(),
      taxIncluded: z.boolean().optional(),
      subscriptionInterval: z.enum(["monthly", "yearly", "custom"]).optional(),
      subscriptionIntervalDays: z.number().int().optional(),
      licenseKeys: z.array(z.string()).optional(),
      variants: z.array(z.object({ name: z.string(), price: z.string(), stock: z.number().int().default(-1) })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { licenseKeys: keys, variants, ...productData } = input;
      const result = await db.insert(products).values({ ...productData, sellerId: ctx.user.id });
      const productId = Number(result[0].insertId);
      if (keys?.length) await db.insert(licenseKeys).values(keys.filter(k => k.trim()).map(k => ({ productId, key: k.trim() })));
      if (variants?.length) await db.insert(productVariants).values(variants.map(v => ({ ...v, productId })));
      if (productData.categoryId) await db.update(categories).set({ productCount: sql`product_count + 1` }).where(eq(categories.id, productData.categoryId));
      return { id: productId };
    }),

  update: adminQuery
    .input(z.object({
      id: z.number().int().positive(),
      name: z.string().min(1).max(255).optional(),
      slug: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      shortDescription: z.string().max(500).optional(),
      price: z.string().optional(),
      compareAtPrice: z.string().optional(),
      categoryId: z.number().int().positive().optional(),
      type: z.enum(["file", "license", "service", "subscription"]).optional(),
      image: z.string().max(500).optional(),
      fileUrl: z.string().max(500).optional(),
      fileSize: z.string().max(50).optional(),
      downloadLimit: z.number().int().optional(),
      stock: z.number().int().optional(),
      status: z.enum(["active", "inactive", "draft"]).optional(),
      visibility: z.enum(["public", "private"]).optional(),
      tags: z.array(z.string()).optional(),
      taxRate: z.string().optional(),
      taxIncluded: z.boolean().optional(),
      subscriptionInterval: z.enum(["monthly", "yearly", "custom"]).optional(),
      subscriptionIntervalDays: z.number().int().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id));
      return { success: true };
    }),

  duplicate: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const product = await db.query.products.findFirst({ where: eq(products.id, input.id), with: { variants: true } });
      if (!product) throw Errors.notFound("Produkt nicht gefunden.");
      const { id, createdAt, updatedAt, soldCount, reviewCount, rating, ...data } = product;
      const result = await db.insert(products).values({ ...data, name: `${data.name} (Kopie)`, slug: `${data.slug}-copy-${Date.now()}`, status: "draft", soldCount: 0, reviewCount: 0, rating: "0" });
      const newId = Number(result[0].insertId);
      if (product.variants?.length) await db.insert(productVariants).values(product.variants.map(({ id: _id, createdAt: _ca, ...v }) => ({ ...v, productId: newId })));
      return { id: newId };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const product = await db.query.products.findFirst({ where: eq(products.id, input.id) });
      if (!product) throw Errors.notFound("Produkt nicht gefunden.");
      await db.delete(products).where(eq(products.id, input.id));
      if (product.categoryId) await db.update(categories).set({ productCount: sql`GREATEST(product_count - 1, 0)` }).where(eq(categories.id, product.categoryId));
      return { success: true };
    }),

  importKeys: adminQuery
    .input(z.object({ productId: z.number().int().positive(), keys: z.array(z.string()).min(1).max(10000) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const cleaned = input.keys.map(k => k.trim()).filter(k => k.length > 0);
      if (!cleaned.length) throw Errors.badRequest("Keine gültigen Keys.");
      await db.insert(licenseKeys).values(cleaned.map(key => ({ productId: input.productId, key })));
      return { imported: cleaned.length };
    }),

  exportKeys: adminQuery
    .input(z.object({ productId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const keys = await db.query.licenseKeys.findMany({ where: eq(licenseKeys.productId, input.productId), orderBy: (k, { asc }) => [asc(k.createdAt)] });
      const csv = ["key,status,created_at", ...keys.map(k => `${k.key},${k.status},${k.createdAt?.toISOString()}`)].join("\n");
      return { csv, count: keys.length };
    }),

  keyStats: adminQuery
    .input(z.object({ productId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [available, sold, total] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(licenseKeys).where(and(eq(licenseKeys.productId, input.productId), eq(licenseKeys.status, "available"))),
        db.select({ count: sql<number>`count(*)` }).from(licenseKeys).where(and(eq(licenseKeys.productId, input.productId), eq(licenseKeys.status, "sold"))),
        db.select({ count: sql<number>`count(*)` }).from(licenseKeys).where(eq(licenseKeys.productId, input.productId)),
      ]);
      return { available: Number(available[0]?.count ?? 0), sold: Number(sold[0]?.count ?? 0), total: Number(total[0]?.count ?? 0) };
    }),

  addVariant: adminQuery
    .input(z.object({ productId: z.number().int().positive(), name: z.string().min(1).max(255), price: z.string(), stock: z.number().int().default(-1), fileUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(productVariants).values(input);
      return { id: Number(result[0].insertId) };
    }),

  updateVariant: adminQuery
    .input(z.object({ id: z.number().int().positive(), name: z.string().optional(), price: z.string().optional(), stock: z.number().int().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(productVariants).set(data).where(eq(productVariants.id, id));
      return { success: true };
    }),

  deleteVariant: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(productVariants).where(eq(productVariants.id, input.id));
      return { success: true };
    }),
});
