import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { and, eq, gt, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { shopBuyerAccounts, shopBuyerSessions, shops } from "@db/schema";
import { Errors } from "@contracts/errors";

const SESSION_TTL_DAYS = 30;

let shopBuyerTablesReady: Promise<void> | null = null;

async function ensureShopBuyerTables() {
  if (!shopBuyerTablesReady) {
    shopBuyerTablesReady = (async () => {
      const db = getDb();

      await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS \`shop_buyer_accounts\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`shop_id\` bigint unsigned NOT NULL,
        \`email\` varchar(320) NOT NULL,
        \`password_hash\` varchar(255) NOT NULL,
        \`name\` varchar(255),
        \`status\` enum('active','blocked','pending') NOT NULL DEFAULT 'active',
        \`email_verified\` boolean NOT NULL DEFAULT false,
        \`last_sign_in_at\` timestamp NULL,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`shop_buyer_shop_email_unique\` (\`shop_id\`, \`email\`),
        KEY \`shop_buyer_shop_idx\` (\`shop_id\`),
        KEY \`shop_buyer_email_idx\` (\`email\`),
        KEY \`shop_buyer_status_idx\` (\`status\`),
        CONSTRAINT \`shop_buyer_accounts_shop_id_shops_id_fk\` FOREIGN KEY (\`shop_id\`) REFERENCES \`shops\`(\`id\`) ON DELETE cascade
      )`));

      await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS \`shop_buyer_sessions\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`account_id\` bigint unsigned NOT NULL,
        \`shop_id\` bigint unsigned NOT NULL,
        \`token\` varchar(128) NOT NULL,
        \`expires_at\` timestamp NOT NULL,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`shop_buyer_sessions_token_unique\` (\`token\`),
        KEY \`shop_buyer_session_token_idx\` (\`token\`),
        KEY \`shop_buyer_session_account_idx\` (\`account_id\`),
        KEY \`shop_buyer_session_shop_idx\` (\`shop_id\`),
        CONSTRAINT \`shop_buyer_sessions_account_id_accounts_id_fk\` FOREIGN KEY (\`account_id\`) REFERENCES \`shop_buyer_accounts\`(\`id\`) ON DELETE cascade,
        CONSTRAINT \`shop_buyer_sessions_shop_id_shops_id_fk\` FOREIGN KEY (\`shop_id\`) REFERENCES \`shops\`(\`id\`) ON DELETE cascade
      )`));
    })().catch((error) => {
      shopBuyerTablesReady = null;
      throw error;
    });
  }

  await shopBuyerTablesReady;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function sessionExpiresAt() {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

async function getShopBySlug(slug: string) {
  const db = getDb();
  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop || shop.status !== "active") throw Errors.notFound("Shop nicht gefunden.");
  return shop;
}

async function resolveSession(shopSlug: string, token?: string) {
  if (!token) return null;
  await ensureShopBuyerTables();
  const db = getDb();
  const shop = await getShopBySlug(shopSlug);
  const row = await db
    .select({
      sessionId: shopBuyerSessions.id,
      expiresAt: shopBuyerSessions.expiresAt,
      accountId: shopBuyerAccounts.id,
      email: shopBuyerAccounts.email,
      name: shopBuyerAccounts.name,
      status: shopBuyerAccounts.status,
      shopId: shopBuyerAccounts.shopId,
    })
    .from(shopBuyerSessions)
    .innerJoin(shopBuyerAccounts, eq(shopBuyerSessions.accountId, shopBuyerAccounts.id))
    .where(and(
      eq(shopBuyerSessions.token, token),
      eq(shopBuyerSessions.shopId, shop.id),
      eq(shopBuyerAccounts.shopId, shop.id),
      gt(shopBuyerSessions.expiresAt, new Date()),
    ))
    .limit(1);

  const session = row[0];
  if (!session || session.status !== "active") return null;
  return {
    id: session.accountId,
    shopId: session.shopId,
    shopSlug,
    email: session.email,
    name: session.name,
  };
}

export const shopBuyerAuthRouter = createRouter({
  me: publicQuery
    .input(z.object({ shopSlug: z.string().min(1), token: z.string().optional() }))
    .query(async ({ input }) => {
      const buyer = await resolveSession(input.shopSlug, input.token);
      return { buyer };
    }),

  register: publicQuery
    .input(z.object({
      shopSlug: z.string().min(1),
      name: z.string().min(2).max(100),
      email: z.string().email().max(320),
      password: z.string().min(8).max(128),
    }))
    .mutation(async ({ input }) => {
      await ensureShopBuyerTables();
      const db = getDb();
      const shop = await getShopBySlug(input.shopSlug);
      const email = normalizeEmail(input.email);
      const existing = await db.query.shopBuyerAccounts.findFirst({
        where: and(eq(shopBuyerAccounts.shopId, shop.id), eq(shopBuyerAccounts.email, email)),
      });
      if (existing) throw Errors.badRequest("Für diesen Shop existiert bereits ein Käuferkonto mit dieser E-Mail.");

      const passwordHash = await bcrypt.hash(input.password, 12);
      const result = await db.insert(shopBuyerAccounts).values({
        shopId: shop.id,
        email,
        name: input.name.trim(),
        passwordHash,
        status: "active",
        emailVerified: false,
        lastSignInAt: new Date(),
      });
      const accountId = Number(result[0].insertId);
      const token = nanoid(64);
      const expiresAt = sessionExpiresAt();
      await db.insert(shopBuyerSessions).values({ accountId, shopId: shop.id, token, expiresAt });
      return {
        success: true,
        token,
        expiresAt,
        buyer: { id: accountId, shopId: shop.id, shopSlug: shop.slug, email, name: input.name.trim() },
      };
    }),

  login: publicQuery
    .input(z.object({ shopSlug: z.string().min(1), email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await ensureShopBuyerTables();
      const db = getDb();
      const shop = await getShopBySlug(input.shopSlug);
      const email = normalizeEmail(input.email);
      const account = await db.query.shopBuyerAccounts.findFirst({
        where: and(eq(shopBuyerAccounts.shopId, shop.id), eq(shopBuyerAccounts.email, email)),
      });
      if (!account || account.status === "blocked") throw Errors.unauthorized("Ungültige E-Mail oder Passwort für diesen Shop.");
      const valid = await bcrypt.compare(input.password, account.passwordHash);
      if (!valid) throw Errors.unauthorized("Ungültige E-Mail oder Passwort für diesen Shop.");

      await db.update(shopBuyerAccounts).set({ lastSignInAt: new Date() }).where(eq(shopBuyerAccounts.id, account.id));
      const token = nanoid(64);
      const expiresAt = sessionExpiresAt();
      await db.insert(shopBuyerSessions).values({ accountId: account.id, shopId: shop.id, token, expiresAt });
      return {
        success: true,
        token,
        expiresAt,
        buyer: { id: account.id, shopId: shop.id, shopSlug: shop.slug, email: account.email, name: account.name },
      };
    }),

  logout: publicQuery
    .input(z.object({ shopSlug: z.string().min(1), token: z.string().optional() }))
    .mutation(async ({ input }) => {
      await ensureShopBuyerTables();
      const db = getDb();
      const shop = await getShopBySlug(input.shopSlug);
      if (input.token) {
        await db.delete(shopBuyerSessions).where(and(eq(shopBuyerSessions.token, input.token), eq(shopBuyerSessions.shopId, shop.id)));
      }
      return { success: true };
    }),
});
