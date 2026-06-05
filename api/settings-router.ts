import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, adminQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { shopSettings } from "@db/schema";

export const settingsRouter = createRouter({
  get: publicQuery.query(async () => {
    const db = getDb();
    const settings = await db.query.shopSettings.findFirst();
    if (!settings) {
      await db.insert(shopSettings).values({
        shopName: "DigiSell",
        currency: "EUR",
        timezone: "Europe/Berlin",
      });
      return db.query.shopSettings.findFirst();
    }
    return settings;
  }),

  update: adminQuery
    .input(
      z.object({
        shopName: z.string().max(255).optional(),
        shopDescription: z.string().optional(),
        logo: z.string().optional(),
        favicon: z.string().optional(),
        currency: z.string().length(3).optional(),
        timezone: z.string().optional(),
        feePercentage: z.string().optional(),
        taxRate: z.string().optional(),
        taxIncluded: z.boolean().optional(),
        theme: z.enum(["dark", "light", "auto"]).optional(),
        maintenanceMode: z.boolean().optional(),
        // E-Mail
        smtpHost: z.string().optional(),
        smtpPort: z.number().int().optional(),
        smtpUser: z.string().optional(),
        smtpPass: z.string().optional(),
        smtpFrom: z.string().optional(),
        // Zahlungsanbieter
        stripePublicKey: z.string().optional(),
        stripeSecretKey: z.string().optional(),
        stripeWebhookSecret: z.string().optional(),
        paypalClientId: z.string().optional(),
        paypalSecret: z.string().optional(),
        paypalMode: z.enum(["sandbox", "live"]).optional(),
        cryptoBtcAddress: z.string().optional(),
        cryptoEthAddress: z.string().optional(),
        cryptoSolAddress: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.query.shopSettings.findFirst();
      const data: any = { ...input, updatedAt: new Date() };
      if (existing) {
        await db.update(shopSettings).set(data).where(eq(shopSettings.id, existing.id));
      } else {
        await db.insert(shopSettings).values({
          shopName: input.shopName ?? "DigiSell",
          currency: input.currency ?? "EUR",
          timezone: input.timezone ?? "Europe/Berlin",
          ...data,
        });
      }
      return { success: true };
    }),
});
