import { z } from "zod";
import { sql } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { systemLogs } from "@db/schema";
import { generateOpenApiSpec } from "./lib/openapi";
import os from "os";

const startTime = Date.now();

export const systemRouter = createRouter({
  // ── Health Check ──────────────────────────────────────────────────────────
  health: publicQuery.query(async () => {
    const db = getDb();
    let dbStatus = "ok";
    let dbLatency = 0;

    try {
      const t0 = Date.now();
      await db.execute(sql`SELECT 1`);
      dbLatency = Date.now() - t0;
    } catch {
      dbStatus = "error";
    }

    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const memUsage = process.memoryUsage();

    return {
      status: dbStatus === "ok" ? "ok" : "degraded",
      version: process.env.npm_package_version ?? "1.0.0",
      uptime: uptimeSeconds,
      timestamp: new Date().toISOString(),
      services: {
        database: { status: dbStatus, latencyMs: dbLatency },
        api: { status: "ok" },
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
        memoryTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
        cpuCount: os.cpus().length,
        loadAvg: os.loadavg(),
      },
    };
  }),

  // ── OpenAPI Spec ──────────────────────────────────────────────────────────
  openApiSpec: publicQuery.query(({ ctx }) => {
    const baseUrl = process.env.APP_URL ?? "https://localhost:3000";
    return generateOpenApiSpec(baseUrl);
  }),

  // ── System Logs ───────────────────────────────────────────────────────────
  logs: adminQuery
    .input(z.object({
      level: z.enum(["info", "warn", "error", "debug", "all"]).default("all"),
      category: z.string().max(100).optional(),
      search: z.string().max(255).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(200).default(50),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const i = input ?? {};
      const page = i.page ?? 1;
      const limit = i.limit ?? 50;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (i.level && i.level !== "all") conditions.push(sql`level = ${i.level}`);
      if (i.category) conditions.push(sql`category = ${i.category}`);
      if (i.search) conditions.push(sql`message LIKE ${`%${i.search}%`}`);

      const where = conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined;

      const [items, countResult] = await Promise.all([
        db.query.systemLogs.findMany({
          where: where as any,
          orderBy: (l, { desc }) => [desc(l.createdAt)],
          limit, offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(systemLogs).where(where as any),
      ]);

      return { items, total: Number(countResult[0]?.count ?? 0), page };
    }),

  // ── Write log entry ───────────────────────────────────────────────────────
  writeLog: adminQuery
    .input(z.object({
      level: z.enum(["info", "warn", "error", "debug"]),
      category: z.string().max(100),
      message: z.string().max(2000),
      metadata: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(systemLogs).values({
        level: input.level,
        category: input.category,
        message: input.message,
        metadata: input.metadata ?? null,
      });
      return { success: true };
    }),

  // ── Database stats ────────────────────────────────────────────────────────
  dbStats: adminQuery.query(async () => {
    const db = getDb();
    const tables = [
      "users", "products", "orders", "order_items", "tickets",
      "license_keys", "affiliates", "subscriptions", "webhooks", "system_logs",
    ];

    const stats: Record<string, number> = {};
    for (const table of tables) {
      try {
        const result = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM \`${table}\``));
        const rows = result[0] as Array<{ count: string }>;
        stats[table] = Number(rows[0]?.count ?? 0);
      } catch {
        stats[table] = -1;
      }
    }

    return { tables: stats, timestamp: new Date().toISOString() };
  }),

  // ── Clear old logs ────────────────────────────────────────────────────────
  clearOldLogs: adminQuery
    .input(z.object({
      olderThanDays: z.number().int().min(1).max(365).default(30),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - input.olderThanDays);

      const result = await db.execute(
        sql`DELETE FROM system_logs WHERE created_at < ${cutoff}`
      );
      return { deleted: (result[0] as any)?.affectedRows ?? 0 };
    }),
});
