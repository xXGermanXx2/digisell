import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { products, shops, userFavorites } from "@db/schema";
import { Errors } from "@contracts/errors";

export const favoritesRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const productFavorites = await db
      .select({
        favoriteId: userFavorites.id,
        notifyPriceChanges: userFavorites.notifyPriceChanges,
        createdAt: userFavorites.createdAt,
        productId: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        image: products.image,
        status: products.status,
        sellerId: products.sellerId,
      })
      .from(userFavorites)
      .innerJoin(products, eq(userFavorites.productId, products.id))
      .where(and(eq(userFavorites.userId, ctx.user.id), eq(userFavorites.type, "product")))
      .orderBy(desc(userFavorites.createdAt));

    const shopFavorites = await db
      .select({
        favoriteId: userFavorites.id,
        notifyShopUpdates: userFavorites.notifyShopUpdates,
        createdAt: userFavorites.createdAt,
        shopId: shops.id,
        name: shops.name,
        slug: shops.slug,
        logo: shops.logo,
        category: shops.category,
        status: shops.status,
        totalProducts: shops.totalProducts,
        totalOrders: shops.totalOrders,
      })
      .from(userFavorites)
      .innerJoin(shops, eq(userFavorites.shopId, shops.id))
      .where(and(eq(userFavorites.userId, ctx.user.id), eq(userFavorites.type, "shop")))
      .orderBy(desc(userFavorites.createdAt));

    return { productFavorites, shopFavorites };
  }),

  addProduct: authedQuery
    .input(z.object({ productId: z.number().int().positive(), notifyPriceChanges: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, input.productId)).limit(1);
      if (!product) throw Errors.notFound("Produkt nicht gefunden.");
      const [existing] = await db.select({ id: userFavorites.id }).from(userFavorites).where(and(eq(userFavorites.userId, ctx.user.id), eq(userFavorites.type, "product"), eq(userFavorites.productId, input.productId))).limit(1);
      if (existing) {
        await db.update(userFavorites).set({ notifyPriceChanges: input.notifyPriceChanges }).where(eq(userFavorites.id, existing.id));
        return { success: true, id: existing.id, updated: true };
      }
      const result = await db.insert(userFavorites).values({ userId: ctx.user.id, type: "product", productId: input.productId, notifyPriceChanges: input.notifyPriceChanges });
      return { success: true, id: Number(result[0].insertId) };
    }),

  removeProduct: authedQuery
    .input(z.object({ productId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(userFavorites).where(and(eq(userFavorites.userId, ctx.user.id), eq(userFavorites.type, "product"), eq(userFavorites.productId, input.productId)));
      return { success: true };
    }),

  addShop: authedQuery
    .input(z.object({ shopId: z.number().int().positive(), notifyShopUpdates: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [shop] = await db.select({ id: shops.id }).from(shops).where(eq(shops.id, input.shopId)).limit(1);
      if (!shop) throw Errors.notFound("Shop nicht gefunden.");
      const [existing] = await db.select({ id: userFavorites.id }).from(userFavorites).where(and(eq(userFavorites.userId, ctx.user.id), eq(userFavorites.type, "shop"), eq(userFavorites.shopId, input.shopId))).limit(1);
      if (existing) {
        await db.update(userFavorites).set({ notifyShopUpdates: input.notifyShopUpdates }).where(eq(userFavorites.id, existing.id));
        return { success: true, id: existing.id, updated: true };
      }
      const result = await db.insert(userFavorites).values({ userId: ctx.user.id, type: "shop", shopId: input.shopId, notifyShopUpdates: input.notifyShopUpdates });
      return { success: true, id: Number(result[0].insertId) };
    }),

  removeShop: authedQuery
    .input(z.object({ shopId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(userFavorites).where(and(eq(userFavorites.userId, ctx.user.id), eq(userFavorites.type, "shop"), eq(userFavorites.shopId, input.shopId)));
      return { success: true };
    }),

  toggleShopNotifications: authedQuery
    .input(z.object({ shopId: z.number().int().positive(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.update(userFavorites)
        .set({ notifyShopUpdates: input.enabled })
        .where(and(eq(userFavorites.userId, ctx.user.id), eq(userFavorites.type, "shop"), eq(userFavorites.shopId, input.shopId)));
      return { success: true };
    }),

  purchasedShops: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db.execute(sql`
      SELECT DISTINCT s.id, s.name, s.slug, s.logo, s.category, s.total_products AS totalProducts, s.total_orders AS totalOrders,
        uf.id AS favoriteId, COALESCE(uf.notify_shop_updates, 0) AS notifyShopUpdates
      FROM orders o
      JOIN shops s ON s.owner_id = o.seller_id
      LEFT JOIN user_favorites uf ON uf.user_id = ${ctx.user.id} AND uf.type = 'shop' AND uf.shop_id = s.id
      WHERE o.customer_id = ${ctx.user.id}
      ORDER BY s.name ASC
    `);
    return Array.isArray(rows) ? rows : (rows as any).rows ?? [];
  }),
});
