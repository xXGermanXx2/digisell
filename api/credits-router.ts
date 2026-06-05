import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  platformCredits,
  platformCreditTransactions,
  shopCredits,
  shopCreditTransactions,
  users,
  shops,
} from "@db/schema";
import { Errors } from "@contracts/errors";

export const creditsRouter = createRouter({

  // ===================== PLATFORM CREDITS (Admin) =====================

  /** Admin: Guthaben an User vergeben */
  adminGrantPlatformCredits: adminQuery
    .input(z.object({
      userId: z.number(),
      amount: z.number().positive(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Upsert balance
      await db.execute(sql`
        INSERT INTO platform_credits (user_id, balance)
        VALUES (${input.userId}, ${input.amount})
        ON DUPLICATE KEY UPDATE balance = balance + ${input.amount}, updated_at = NOW()
      `);
      // Log transaction
      await db.insert(platformCreditTransactions).values({
        userId: input.userId,
        amount: String(input.amount),
        type: "credit",
        description: input.description ?? "Admin-Gutschrift",
        grantedByAdminId: ctx.user.id,
      });
      return { success: true };
    }),

  /** Admin: Guthaben abziehen */
  adminDeductPlatformCredits: adminQuery
    .input(z.object({
      userId: z.number(),
      amount: z.number().positive(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [balance] = await db.select().from(platformCredits).where(eq(platformCredits.userId, input.userId));
      if (!balance || parseFloat(balance.balance) < input.amount) {
        throw Errors.badRequest("Nicht genug Guthaben");
      }
      await db.execute(sql`
        UPDATE platform_credits SET balance = balance - ${input.amount}, updated_at = NOW()
        WHERE user_id = ${input.userId}
      `);
      await db.insert(platformCreditTransactions).values({
        userId: input.userId,
        amount: String(-input.amount),
        type: "debit",
        description: input.description ?? "Admin-Abzug",
        grantedByAdminId: ctx.user.id,
      });
      return { success: true };
    }),

  /** Admin: Alle User-Guthaben auflisten */
  adminListPlatformCredits: adminQuery
    .input(z.object({ page: z.number().default(1), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const rows = await db.execute(sql`
        SELECT pc.user_id, pc.balance, pc.updated_at,
               u.name, u.email, u.avatar
        FROM platform_credits pc
        JOIN users u ON u.id = pc.user_id
        ORDER BY pc.balance DESC
        LIMIT ${input.limit} OFFSET ${offset}
      `);
      const [countRow] = await db.execute(sql`SELECT COUNT(*) as total FROM platform_credits`);
      return { rows: (rows as any[])[0], total: (countRow as any[])[0]?.total ?? 0 };
    }),

  /** Admin: Transaktionsverlauf eines Users */
  adminGetPlatformCreditHistory: adminQuery
    .input(z.object({ userId: z.number(), page: z.number().default(1), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const rows = await db.select().from(platformCreditTransactions)
        .where(eq(platformCreditTransactions.userId, input.userId))
        .orderBy(desc(platformCreditTransactions.createdAt))
        .limit(input.limit).offset(offset);
      return rows;
    }),

  // ===================== PLATFORM CREDITS (User) =====================

  /** User: Eigenes Guthaben abrufen */
  getMyPlatformCredits: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [balance] = await db.select().from(platformCredits)
      .where(eq(platformCredits.userId, ctx.user.id));
    return { balance: balance ? parseFloat(balance.balance) : 0 };
  }),

  /** User: Eigene Transaktionen */
  getMyPlatformCreditHistory: authedQuery
    .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const rows = await db.select().from(platformCreditTransactions)
        .where(eq(platformCreditTransactions.userId, ctx.user.id))
        .orderBy(desc(platformCreditTransactions.createdAt))
        .limit(input.limit).offset(offset);
      return rows;
    }),

  // ===================== SHOP CREDITS (Seller) =====================

  /** Seller: Shop-Guthaben an User vergeben */
  sellerGrantShopCredits: authedQuery
    .input(z.object({
      shopId: z.number(),
      userId: z.number(),
      amount: z.number().positive(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Prüfen ob der Seller Eigentümer des Shops ist
      const [shop] = await db.select().from(shops)
        .where(and(eq(shops.id, input.shopId), eq(shops.ownerId, ctx.user.id)));
      if (!shop) throw Errors.forbidden("Kein Zugriff auf diesen Shop");

      await db.execute(sql`
        INSERT INTO shop_credits (shop_id, user_id, balance)
        VALUES (${input.shopId}, ${input.userId}, ${input.amount})
        ON DUPLICATE KEY UPDATE balance = balance + ${input.amount}, updated_at = NOW()
      `);
      await db.insert(shopCreditTransactions).values({
        shopId: input.shopId,
        userId: input.userId,
        amount: String(input.amount),
        type: "credit",
        description: input.description ?? "Shop-Gutschrift",
        grantedBySellerId: ctx.user.id,
      });
      return { success: true };
    }),

  /** Seller: Shop-Guthaben abziehen */
  sellerDeductShopCredits: authedQuery
    .input(z.object({
      shopId: z.number(),
      userId: z.number(),
      amount: z.number().positive(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [shop] = await db.select().from(shops)
        .where(and(eq(shops.id, input.shopId), eq(shops.ownerId, ctx.user.id)));
      if (!shop) throw Errors.forbidden("Kein Zugriff auf diesen Shop");

      const [balance] = await db.select().from(shopCredits)
        .where(and(eq(shopCredits.shopId, input.shopId), eq(shopCredits.userId, input.userId)));
      if (!balance || parseFloat(balance.balance) < input.amount) {
        throw Errors.badRequest("Nicht genug Shop-Guthaben");
      }
      await db.execute(sql`
        UPDATE shop_credits SET balance = balance - ${input.amount}, updated_at = NOW()
        WHERE shop_id = ${input.shopId} AND user_id = ${input.userId}
      `);
      await db.insert(shopCreditTransactions).values({
        shopId: input.shopId,
        userId: input.userId,
        amount: String(-input.amount),
        type: "debit",
        description: input.description ?? "Shop-Abzug",
        grantedBySellerId: ctx.user.id,
      });
      return { success: true };
    }),

  /** Seller: Alle Kunden-Guthaben im Shop auflisten */
  sellerListShopCredits: authedQuery
    .input(z.object({ shopId: z.number(), page: z.number().default(1), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [shop] = await db.select().from(shops)
        .where(and(eq(shops.id, input.shopId), eq(shops.ownerId, ctx.user.id)));
      if (!shop) throw Errors.forbidden("Kein Zugriff auf diesen Shop");

      const offset = (input.page - 1) * input.limit;
      const rows = await db.execute(sql`
        SELECT sc.user_id, sc.balance, sc.updated_at,
               u.name, u.email, u.avatar
        FROM shop_credits sc
        JOIN users u ON u.id = sc.user_id
        WHERE sc.shop_id = ${input.shopId}
        ORDER BY sc.balance DESC
        LIMIT ${input.limit} OFFSET ${offset}
      `);
      const [countRow] = await db.execute(sql`
        SELECT COUNT(*) as total FROM shop_credits WHERE shop_id = ${input.shopId}
      `);
      return { rows: (rows as any[])[0], total: (countRow as any[])[0]?.total ?? 0 };
    }),

  /** Seller: Transaktionsverlauf eines Kunden im Shop */
  sellerGetShopCreditHistory: authedQuery
    .input(z.object({ shopId: z.number(), userId: z.number(), page: z.number().default(1), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [shop] = await db.select().from(shops)
        .where(and(eq(shops.id, input.shopId), eq(shops.ownerId, ctx.user.id)));
      if (!shop) throw Errors.forbidden("Kein Zugriff auf diesen Shop");

      const offset = (input.page - 1) * input.limit;
      const rows = await db.select().from(shopCreditTransactions)
        .where(and(
          eq(shopCreditTransactions.shopId, input.shopId),
          eq(shopCreditTransactions.userId, input.userId)
        ))
        .orderBy(desc(shopCreditTransactions.createdAt))
        .limit(input.limit).offset(offset);
      return rows;
    }),

  // ===================== SHOP CREDITS (User/Buyer) =====================

  /** User: Eigenes Guthaben in einem Shop abrufen */
  getMyShopCredits: authedQuery
    .input(z.object({ shopId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [balance] = await db.select().from(shopCredits)
        .where(and(eq(shopCredits.shopId, input.shopId), eq(shopCredits.userId, ctx.user.id)));
      return { balance: balance ? parseFloat(balance.balance) : 0 };
    }),

  /** User: Eigene Shop-Transaktionen */
  getMyShopCreditHistory: authedQuery
    .input(z.object({ shopId: z.number(), page: z.number().default(1), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const rows = await db.select().from(shopCreditTransactions)
        .where(and(
          eq(shopCreditTransactions.shopId, input.shopId),
          eq(shopCreditTransactions.userId, ctx.user.id)
        ))
        .orderBy(desc(shopCreditTransactions.createdAt))
        .limit(input.limit).offset(offset);
      return rows;
    }),

  /** Public: Shop-Guthaben-Info (ob Guthaben-System aktiv ist) */
  getShopCreditInfo: authedQuery
    .input(z.object({ shopId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [balance] = await db.select().from(shopCredits)
        .where(and(eq(shopCredits.shopId, input.shopId), eq(shopCredits.userId, ctx.user.id)));
      const [shop] = await db.select({ name: shops.name, slug: shops.slug })
        .from(shops).where(eq(shops.id, input.shopId));
      return {
        shopName: shop?.name ?? "",
        balance: balance ? parseFloat(balance.balance) : 0,
      };
    }),
});
