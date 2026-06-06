import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { userNotifications } from "@db/schema";

export const notificationsRouter = createRouter({
  list: authedQuery
    .input(z.object({
      unreadOnly: z.boolean().default(false),
      type: z.enum(["order", "download", "ticket", "refund", "promo", "system", "security", "price_change", "all"]).default("all"),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const i = input ?? { unreadOnly: false, type: "all", page: 1, limit: 20 } as const;
      const db = getDb();
      const conditions = [eq(userNotifications.userId, ctx.user.id)];
      if (i.unreadOnly) conditions.push(eq(userNotifications.isRead, false));
      if (i.type && i.type !== "all") conditions.push(eq(userNotifications.type, i.type));
      const page = i.page ?? 1;
      const limit = i.limit ?? 20;
      const offset = (page - 1) * limit;
      const [items, countResult, unreadResult] = await Promise.all([
        db.query.userNotifications.findMany({ where: and(...conditions), orderBy: [desc(userNotifications.createdAt)], limit, offset }),
        db.select({ count: sql<number>`count(*)` }).from(userNotifications).where(and(...conditions)),
        db.select({ count: sql<number>`count(*)` }).from(userNotifications).where(and(eq(userNotifications.userId, ctx.user.id), eq(userNotifications.isRead, false))),
      ]);
      return { items, total: Number(countResult[0]?.count ?? 0), unread: Number(unreadResult[0]?.count ?? 0), page };
    }),

  markRead: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.update(userNotifications).set({ isRead: true, readAt: new Date() }).where(and(eq(userNotifications.id, input.id), eq(userNotifications.userId, ctx.user.id)));
      return { success: true };
    }),

  markAllRead: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db.update(userNotifications).set({ isRead: true, readAt: new Date() }).where(and(eq(userNotifications.userId, ctx.user.id), eq(userNotifications.isRead, false)));
    return { success: true };
  }),
});
