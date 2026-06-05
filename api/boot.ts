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

    // Hilfsfunktion: Spalte nur hinzufügen wenn sie noch nicht existiert (MySQL 8 kompatibel)
    async function addColumnIfMissing(table: string, column: string, definition: string): Promise<string> {
      const rows = await db.execute(sql.raw(
        `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = '${table}' AND COLUMN_NAME = '${column}'`
      )) as any;
      const cnt = rows[0]?.[0]?.cnt ?? rows[0]?.cnt ?? 0;
      if (Number(cnt) > 0) return `SKIP (already exists): ${table}.${column}`;
      await db.execute(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`));
      return `OK: Added ${table}.${column}`;
    }

    const results: string[] = [];

    // orders-Tabelle: fehlende Spalten
    const orderColumns: [string, string][] = [
      ["seller_id", "BIGINT UNSIGNED NULL"],
      ["affiliate_id", "BIGINT UNSIGNED NULL"],
      ["affiliate_commission", "DECIMAL(10,2) DEFAULT 0"],
      ["ip_address", "VARCHAR(45) NULL"],
      ["fraud_score", "INT DEFAULT 0"],
      ["notes", "TEXT NULL"],
      ["billing_name", "VARCHAR(255) NULL"],
      ["billing_email", "VARCHAR(320) NULL"],
      ["billing_address", "VARCHAR(500) NULL"],
      ["billing_city", "VARCHAR(100) NULL"],
      ["billing_zip", "VARCHAR(20) NULL"],
      ["billing_country", "VARCHAR(2) NULL"],
      ["billing_vat_id", "VARCHAR(50) NULL"],
      ["fee", "DECIMAL(10,2) NOT NULL DEFAULT 0"],
      ["discount", "DECIMAL(10,2) DEFAULT 0"],
      ["stripe_session_id", "VARCHAR(255) NULL"],
      ["paypal_order_id", "VARCHAR(255) NULL"],
      ["paypal_capture_id", "VARCHAR(255) NULL"],
      ["coupon_code", "VARCHAR(50) NULL"],
      ["updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"],
    ];
    for (const [col, def] of orderColumns) {
      try { results.push(await addColumnIfMissing("orders", col, def)); }
      catch (e: any) { results.push(`ERROR: orders.${col}: ${e.message?.substring(0, 80)}`); }
    }

    // blocklists-Tabelle erstellen
    try {
      await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS \`blocklists\` (\`id\` SERIAL PRIMARY KEY, \`type\` ENUM('ip','email','domain') NOT NULL, \`value\` VARCHAR(255) NOT NULL, \`reason\` TEXT, \`created_by\` BIGINT UNSIGNED, \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY \`blocklist_unique\` (\`type\`, \`value\`))`));
      results.push("OK: blocklists table");
    } catch (e: any) { results.push(`SKIP blocklists: ${e.message?.substring(0, 60)}`); }

    // banned_words-Tabelle für administrativ verwaltbare Shop-/Produkt-Sperrwörter erstellen
    try {
      await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS \`banned_words\` (\`id\` SERIAL PRIMARY KEY, \`word\` VARCHAR(255) NOT NULL, \`match_mode\` ENUM('exact','contains') NOT NULL DEFAULT 'contains', \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE, \`reason\` TEXT, \`created_by\` BIGINT UNSIGNED, \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY \`banned_words_word_idx\` (\`word\`), KEY \`banned_words_active_idx\` (\`is_active\`))`));
      results.push("OK: banned_words table");
    } catch (e: any) { results.push(`SKIP banned_words: ${e.message?.substring(0, 60)}`); }

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
