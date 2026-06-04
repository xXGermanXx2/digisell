import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { fraudRules } from "@db/schema";

export const fraudRouter = createRouter({
  list: adminQuery.query(async () => {
    const db = getDb();
    return db.query.fraudRules.findMany({
      orderBy: (fraudRules, { desc }) => [desc(fraudRules.createdAt)],
    });
  }),

  create: adminQuery
    .input(
      z.object({
        type: z.enum(["ip", "email", "domain"]),
        value: z.string().min(1).max(255),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(fraudRules).values(input);
      return { id: Number(result[0].insertId) };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(fraudRules).where(eq(fraudRules.id, input.id));
      return { success: true };
    }),

  check: adminQuery
    .input(
      z.object({
        ip: z.string().optional(),
        email: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const risks = [];
      let score = 0;
      
      if (input.ip) {
        const ipRule = await db.query.fraudRules.findFirst({
          where: and(
            eq(fraudRules.type, "ip"),
            eq(fraudRules.value, input.ip),
            eq(fraudRules.isActive, true)
          ),
        });
        if (ipRule) {
          risks.push({ type: "ip", value: input.ip, reason: ipRule.reason });
          score += 100;
        }
      }
      
      if (input.email) {
        const emailRule = await db.query.fraudRules.findFirst({
          where: and(
            eq(fraudRules.type, "email"),
            eq(fraudRules.value, input.email),
            eq(fraudRules.isActive, true)
          ),
        });
        if (emailRule) {
          risks.push({ type: "email", value: input.email, reason: emailRule.reason });
          score += 100;
        }
        
        // Check domain
        const domain = input.email.split("@")[1];
        if (domain) {
          const domainRule = await db.query.fraudRules.findFirst({
            where: and(
              eq(fraudRules.type, "domain"),
              eq(fraudRules.value, domain),
              eq(fraudRules.isActive, true)
            ),
          });
          if (domainRule) {
            risks.push({ type: "domain", value: domain, reason: domainRule.reason });
            score += 50;
          }
        }
      }
      
      return { score, risks, blocked: score >= 100 };
    }),
});
