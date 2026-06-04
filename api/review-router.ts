import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { reviews, products } from "@db/schema";

export const reviewRouter = createRouter({
  listByProduct: publicQuery
    .input(z.object({ productId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.reviews.findMany({
        where: eq(reviews.productId, input.productId),
        orderBy: [desc(reviews.createdAt)],
      });
    }),

  create: publicQuery
    .input(
      z.object({
        productId: z.number().int().positive(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().optional(),
        customerName: z.string().min(1),
        customerId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      
      const result = await db.insert(reviews).values({
        productId: input.productId,
        customerId: input.customerId ?? null,
        customerName: input.customerName,
        rating: input.rating,
        comment: input.comment ?? null,
      });
      
      const productReviews = await db.query.reviews.findMany({
        where: eq(reviews.productId, input.productId),
      });
      
      const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
      
      await db.update(products)
        .set({ 
          rating: avgRating.toFixed(1),
          reviewCount: productReviews.length,
        })
        .where(eq(products.id, input.productId));
      
      return { id: Number(result[0].insertId) };
    }),
});
