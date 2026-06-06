import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { fraudRules } from "@db/schema";
import { checkVpnProxy, createBrowserFingerprint } from "./lib/fraud-detection";

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
        userAgent: z.string().optional(),
        acceptLanguage: z.string().optional(),
        platform: z.string().optional(),
        timezone: z.string().optional(),
        screen: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const settings = await db.query.shopSettings.findFirst();
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
      
      if (input.ip) {
        const vpnProxy = await checkVpnProxy(input.ip, {
          enabled: settings?.vpnProxyDetectionEnabled,
          provider: settings?.vpnProxyProvider as any,
          apiKey: settings?.vpnProxyApiKey,
          threshold: settings?.vpnProxyBlockThreshold,
        });
        if (vpnProxy.enabled && (vpnProxy.blocked || vpnProxy.reason === "missing-api-key")) {
          risks.push({
            type: "vpn_proxy",
            value: input.ip,
            reason: vpnProxy.reason ?? `Provider ${vpnProxy.provider}: Score ${vpnProxy.score}`,
            provider: vpnProxy.provider,
          });
          score += vpnProxy.blocked ? Math.max(50, vpnProxy.score) : 10;
        }
      }

      if (settings?.fingerprintingEnabled) {
        const fingerprint = createBrowserFingerprint({
          userAgent: input.userAgent,
          acceptLanguage: input.acceptLanguage,
          platform: input.platform,
          timezone: input.timezone,
          screen: input.screen,
          salt: settings.fingerprintingSalt,
        });
        risks.push({ type: "fingerprint", value: fingerprint, reason: `Mode ${settings.fingerprintingMode ?? "passive"}` });
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
