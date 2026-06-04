import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { categories } from "@db/schema";

export const categoryRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });
  }),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        slug: z.string().min(1).max(255),
        icon: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(categories).values(input);
      return { id: Number(result[0].insertId), ...input };
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().min(1).max(255).optional(),
        slug: z.string().min(1).max(255).optional(),
        icon: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(categories).set(data).where(eq(categories.id, id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(categories).where(eq(categories.id, input.id));
      return { success: true };
    }),
});
