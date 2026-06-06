#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required for production backups.");
  process.exit(1);
}

const outputDir = resolve(process.env.BACKUP_DIR || "database/backups");
const retentionDays = Number.parseInt(process.env.BACKUP_RETENTION_DAYS || "14", 10);
await mkdir(outputDir, { recursive: true });

const url = new URL(databaseUrl);
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const target = join(outputDir, `digisell-${timestamp}.sql`);
const args = [
  `--host=${url.hostname}`,
  `--port=${url.port || "3306"}`,
  `--user=${decodeURIComponent(url.username)}`,
  decodeURIComponent(url.pathname.replace(/^\//, "")),
  `--result-file=${target}`,
  "--single-transaction",
  "--routines",
  "--triggers",
];

await new Promise((resolveBackup, rejectBackup) => {
  const child = spawn("mysqldump", args, {
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, MYSQL_PWD: decodeURIComponent(url.password) },
  });
  child.on("exit", (code) => code === 0 ? resolveBackup(undefined) : rejectBackup(new Error(`mysqldump exited with code ${code}`)));
});

const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
for (const file of await readdir(outputDir)) {
  if (!file.endsWith(".sql")) continue;
  const fullPath = join(outputDir, file);
  const fileStat = await stat(fullPath);
  if (fileStat.mtimeMs < cutoff) await rm(fullPath, { force: true });
}

console.log(`Backup written to ${target}`);
