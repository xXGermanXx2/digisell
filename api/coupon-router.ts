import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { coupons } from "@db/schema";

export const couponRouter = createRouter({
  list: adminQuery
    .input(
      z.object({
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(50).optional().default(20),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const { page, limit } = input ?? {};
      const offset = ((page ?? 1) - 1) * (limit ?? 20);
      
      const items = await db.query.coupons.findMany({
        orderBy: (coupons, { desc }) => [desc(coupons.createdAt)],
        limit,
        offset,
      });
      
      return { items, page: page ?? 1 };
    }),

  create: adminQuery
    .input(
      z.object({
        code: z.string().min(1).max(50),
        type: z.enum(["percentage", "fixed"]),
        value: z.string().regex(/^\d+(\.\d{1,2})?$/),
        maxUses: z.number().int().min(-1).optional().default(-1),
        minOrderAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().default("0"),
        expiresAt: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      
      const result = await db.insert(coupons).values({
        code: input.code.toUpperCase(),
        type: input.type,
        value: input.value,
        maxUses: input.maxUses,
        minOrderAmount: input.minOrderAmount,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      });
      
      return { id: Number(result[0].insertId) };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(coupons).where(eq(coupons.id, input.id));
      return { success: true };
    }),

  validate: publicQuery
    .input(
      z.object({
        code: z.string(),
        orderAmount: z.string().optional().default("0"),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      
      const coupon = await db.query.coupons.findFirst({
        where: and(
          eq(coupons.code, input.code.toUpperCase()),
          eq(coupons.isActive, true)
        ),
      });
      
      if (!coupon) {
        return { valid: false, message: "Gutscheincode nicht gefunden" };
      }
      
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return { valid: false, message: "Gutscheincode ist abgelaufen" };
      }
      
      if (coupon.maxUses !== null && coupon.maxUses !== -1 && coupon.usedCount >= coupon.maxUses) {
        return { valid: false, message: "Gutscheincode wurde bereits vollständig eingelöst" };
      }
      
      const minAmount = parseFloat(coupon.minOrderAmount ?? "0");
      const orderAmount = parseFloat(input.orderAmount);
      if (orderAmount < minAmount) {
        return { 
          valid: false, 
          message: `Mindestbestellwert von ${minAmount.toFixed(2)} EUR nicht erreicht` 
        };
      }
      
      return { 
        valid: true, 
        coupon: {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
        }
      };
    }),
});
