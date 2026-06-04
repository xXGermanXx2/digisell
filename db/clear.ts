import { getDb } from "../api/queries/connection";
import { sql } from "drizzle-orm";

async function clear() {
  const db = getDb();
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  await db.execute(sql`DROP TABLE IF EXISTS ticket_messages, tickets, coupons, reviews, cart_items, order_items, orders, license_keys, products, categories, shop_settings, fraud_rules, users`);
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
  console.log("All tables dropped");
}

clear().catch(console.error);
