import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import { getDb } from "./queries/connection";
import { sql } from "drizzle-orm";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

// ── Migrations-Endpunkt ────────────────────────────────────────────────────
app.get("/api/run-migration", async (c) => {
  const secret = c.req.query("secret");
  if (secret !== "digisell-migrate-2024") return c.json({ error: "Unauthorized" }, 401);
  try {
    const db = getDb();
    const dbName = env.databaseUrl.split("/").pop()?.split("?")[0] ?? "railway";
    const migrations = [
      // orders-Tabelle: fehlende Spalten
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`seller_id\` BIGINT UNSIGNED NULL`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`affiliate_id\` BIGINT UNSIGNED NULL`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`affiliate_commission\` DECIMAL(10,2) DEFAULT 0`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`ip_address\` VARCHAR(45) NULL`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`fraud_score\` INT DEFAULT 0`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`notes\` TEXT NULL`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`billing_name\` VARCHAR(255) NULL`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`billing_email\` VARCHAR(320) NULL`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`billing_address\` VARCHAR(500) NULL`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`billing_city\` VARCHAR(100) NULL`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`billing_zip\` VARCHAR(20) NULL`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`billing_country\` VARCHAR(2) NULL`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`billing_vat_id\` VARCHAR(50) NULL`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`fee\` DECIMAL(10,2) NOT NULL DEFAULT 0`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`discount\` DECIMAL(10,2) DEFAULT 0`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`stripe_session_id\` VARCHAR(255) NULL`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`paypal_order_id\` VARCHAR(255) NULL`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`paypal_capture_id\` VARCHAR(255) NULL`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`coupon_code\` VARCHAR(50) NULL`,
      `ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
      // blocklists-Tabelle erstellen
      `CREATE TABLE IF NOT EXISTS \`blocklists\` (\`id\` SERIAL PRIMARY KEY, \`type\` ENUM('ip','email','domain') NOT NULL, \`value\` VARCHAR(255) NOT NULL, \`reason\` TEXT, \`created_by\` BIGINT UNSIGNED, \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY \`blocklist_unique\` (\`type\`, \`value\`))`,
    ];
    const results: string[] = [];
    for (const migration of migrations) {
      try {
        await db.execute(sql.raw(migration));
        results.push(`OK: ${migration.substring(0, 80)}`);
      } catch (e: any) {
        results.push(`SKIP (${e.message?.substring(0, 60)}): ${migration.substring(0, 60)}`);
      }
    }
    return c.json({ success: true, results });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
