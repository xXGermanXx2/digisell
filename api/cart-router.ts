import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { cartItems } from "@db/schema";

export const cartRouter = createRouter({
  get: publicQuery
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const items = await db.query.cartItems.findMany({
        where: eq(cartItems.sessionId, input.sessionId),
        with: {
          product: true,
        },
      });
      
      const total = items.reduce((sum, item) => {
        const product = item.product as { price: string } | null;
        const price = product ? parseFloat(product.price) : 0;
        return sum + (price * item.quantity);
      }, 0);
      
      return { items, total: total.toFixed(2), count: items.length };
    }),

  add: publicQuery
    .input(
      z.object({
        sessionId: z.string(),
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).default(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      
      const existing = await db.query.cartItems.findFirst({
        where: and(
          eq(cartItems.sessionId, input.sessionId),
          eq(cartItems.productId, input.productId)
        ),
      });
      
      if (existing) {
        await db.update(cartItems)
          .set({ quantity: existing.quantity + input.quantity })
          .where(eq(cartItems.id, existing.id));
        return { success: true, updated: true };
      }
      
      await db.insert(cartItems).values({
        sessionId: input.sessionId,
        productId: input.productId,
        quantity: input.quantity,
      });
      
      return { success: true, updated: false };
    }),

  updateQty: publicQuery
    .input(
      z.object({
        cartItemId: z.number().int().positive(),
        quantity: z.number().int().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(cartItems)
        .set({ quantity: input.quantity })
        .where(eq(cartItems.id, input.cartItemId));
      return { success: true };
    }),

  remove: publicQuery
    .input(z.object({ cartItemId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(cartItems).where(eq(cartItems.id, input.cartItemId));
      return { success: true };
    }),

  clear: publicQuery
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(cartItems).where(eq(cartItems.sessionId, input.sessionId));
      return { success: true };
    }),
});
