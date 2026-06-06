import { sql } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { shopSettings } from "@db/schema";

const startTime = Date.now();

function line(name: string, value: number, labels?: Record<string, string>) {
  const labelText = labels && Object.keys(labels).length
    ? `{${Object.entries(labels).map(([k, v]) => `${k}="${String(v).replace(/"/g, '\"')}"`).join(",")}}`
    : "";
  return `${name}${labelText} ${Number.isFinite(value) ? value : 0}`;
}

export async function validateMetricsToken(token?: string | null): Promise<boolean> {
  const db = getDb();
  const settings = await db.query.shopSettings.findFirst();
  if (!settings?.monitoringEnabled) return false;
  if (!settings.monitoringMetricsToken) return true;
  return token === settings.monitoringMetricsToken;
}

export async function renderPrometheusMetrics(): Promise<string> {
  const db = getDb();
  let dbUp = 1;
  let dbLatencyMs = 0;
  try {
    const started = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - started;
  } catch {
    dbUp = 0;
  }

  const counts: Record<string, number> = {};
  for (const table of ["users", "shops", "products", "orders", "tickets", "system_logs"]) {
    try {
      const result = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM \`${table}\``)) as any;
      counts[table] = Number(result[0]?.[0]?.count ?? result[0]?.count ?? 0);
    } catch {
      counts[table] = 0;
    }
  }

  const mem = process.memoryUsage();
  const rows = [
    "# HELP digisell_up Application availability flag",
    "# TYPE digisell_up gauge",
    line("digisell_up", 1),
    "# HELP digisell_database_up Database availability flag",
    "# TYPE digisell_database_up gauge",
    line("digisell_database_up", dbUp),
    "# HELP digisell_database_latency_ms Database latency in milliseconds",
    "# TYPE digisell_database_latency_ms gauge",
    line("digisell_database_latency_ms", dbLatencyMs),
    "# HELP digisell_uptime_seconds Application uptime in seconds",
    "# TYPE digisell_uptime_seconds counter",
    line("digisell_uptime_seconds", Math.floor((Date.now() - startTime) / 1000)),
    "# HELP digisell_memory_heap_used_bytes Node.js heap used",
    "# TYPE digisell_memory_heap_used_bytes gauge",
    line("digisell_memory_heap_used_bytes", mem.heapUsed),
    "# HELP digisell_table_rows Database table row counts",
    "# TYPE digisell_table_rows gauge",
    ...Object.entries(counts).map(([table, count]) => line("digisell_table_rows", count, { table })),
  ];
  return `${rows.join("\n")}\n`;
}
