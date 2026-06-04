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
      // Create default settings
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
        theme: z.enum(["dark", "light", "auto"]).optional(),
        maintenanceMode: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      
      const existing = await db.query.shopSettings.findFirst();
      
      if (existing) {
        await db.update(shopSettings)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(shopSettings.id, existing.id));
      } else {
        await db.insert(shopSettings).values({
          shopName: input.shopName ?? "DigiSell",
          shopDescription: input.shopDescription ?? null,
          logo: input.logo ?? null,
          favicon: input.favicon ?? null,
          currency: input.currency ?? "EUR",
          timezone: input.timezone ?? "Europe/Berlin",
          feePercentage: input.feePercentage ? parseFloat(input.feePercentage).toFixed(2) : "5.00",
          theme: input.theme ?? "dark",
          maintenanceMode: input.maintenanceMode ?? false,
        });
      }
      
      return { success: true };
    }),
});
