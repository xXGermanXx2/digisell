import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  decimal,
  boolean,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ===================== USERS =====================
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["admin", "seller", "customer"]).default("customer").notNull(),
  status: mysqlEnum("status", ["active", "blocked", "pending"]).default("pending").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerifyToken: varchar("email_verify_token", { length: 255 }),
  emailVerifyExpires: timestamp("email_verify_expires"),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  twoFactorSecret: varchar("two_factor_secret", { length: 255 }),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorBackupCodes: json("two_factor_backup_codes").$type<string[]>(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  // Profile
  bio: text("bio"),
  website: varchar("website", { length: 500 }),
  phone: varchar("phone", { length: 50 }),
  country: varchar("country", { length: 2 }),
  timezone: varchar("timezone", { length: 100 }).default("Europe/Berlin"),
  language: varchar("language", { length: 10 }).default("de"),
  // Subscription / Plan
  subscriptionPlan: mysqlEnum("subscription_plan", ["free", "premium", "business", "enterprise"]).notNull().default("free"),
  subscriptionStatus: mysqlEnum("subscription_status", ["active", "expired", "cancelled", "none"]).notNull().default("none"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  shopLimit: int("shop_limit").notNull().default(1),
  productLimit: int("product_limit").notNull().default(10),
  storageLimit: int("storage_limit").notNull().default(500),
  isLifetimePremium: boolean("is_lifetime_premium").notNull().default(false),
  // Notifications
  notifyEmail: boolean("notify_email").notNull().default(true),
  notifyOrderEmail: boolean("notify_order_email").notNull().default(true),
  notifyTicketEmail: boolean("notify_ticket_email").notNull().default(true),
  notifyNewsletterEmail: boolean("notify_newsletter_email").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
}, (t) => ({
  emailIdx: index("email_idx").on(t.email),
  unionIdIdx: index("union_id_idx").on(t.unionId),
}));

// ===================== REFRESH TOKENS =====================
export const refreshTokens = mysqlTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 500 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  tokenIdx: index("token_idx").on(t.token),
  userIdx: index("user_idx").on(t.userId),
}));

// ===================== API KEYS =====================
export const apiKeys = mysqlTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(),
  keyPrefix: varchar("key_prefix", { length: 20 }).notNull(),
  permissions: json("permissions").$type<string[]>().default([]),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userIdx: index("user_idx").on(t.userId),
  keyHashIdx: index("key_hash_idx").on(t.keyHash),
}));

// ===================== CATEGORIES =====================
export const categories = mysqlTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  icon: varchar("icon", { length: 100 }),
  description: text("description"),
  productCount: int("product_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================== PRODUCTS =====================
export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  shortDescription: varchar("short_description", { length: 500 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  categoryId: bigint("category_id", { mode: "number", unsigned: true }).references(() => categories.id),
  sellerId: bigint("seller_id", { mode: "number", unsigned: true }).references(() => users.id),
  type: mysqlEnum("type", ["file", "license", "service", "subscription"]).notNull().default("file"),
  image: varchar("image", { length: 500 }),
  fileUrl: varchar("file_url", { length: 500 }),
  fileSize: varchar("file_size", { length: 50 }),
  downloadLimit: int("download_limit").default(-1),
  stock: int("stock").notNull().default(-1),
  soldCount: int("sold_count").notNull().default(0),
  status: mysqlEnum("status", ["active", "inactive", "draft"]).notNull().default("draft"),
  visibility: mysqlEnum("visibility", ["public", "private"]).notNull().default("public"),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: int("review_count").notNull().default(0),
  tags: json("tags").$type<string[]>(),
  // Tax
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxIncluded: boolean("tax_included").notNull().default(false),
  // Subscription fields
  subscriptionInterval: mysqlEnum("subscription_interval", ["monthly", "yearly", "custom"]),
  subscriptionIntervalDays: int("subscription_interval_days"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (t) => ({
  slugIdx: index("slug_idx").on(t.slug),
  sellerIdx: index("seller_idx").on(t.sellerId),
  statusIdx: index("status_idx").on(t.status),
}));

// ===================== PRODUCT VARIANTS =====================
export const productVariants = mysqlTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: bigint("product_id", { mode: "number", unsigned: true }).references(() => products.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: int("stock").notNull().default(-1),
  fileUrl: varchar("file_url", { length: 500 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================== PRODUCT FILES =====================
export const productFiles = mysqlTable("product_files", {
  id: serial("id").primaryKey(),
  productId: bigint("product_id", { mode: "number", unsigned: true }).references(() => products.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  size: varchar("size", { length: 50 }),
  mimeType: varchar("mime_type", { length: 100 }),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================== LICENSE KEYS =====================
export const licenseKeys = mysqlTable("license_keys", {
  id: serial("id").primaryKey(),
  productId: bigint("product_id", { mode: "number", unsigned: true }).references(() => products.id).notNull(),
  key: varchar("key", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["available", "sold", "refunded"]).notNull().default("available"),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).references(() => orders.id),
  usedAt: timestamp("used_at"),
  soldAt: timestamp("sold_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  productIdx: index("product_idx").on(t.productId),
  statusIdx: index("status_idx").on(t.status),
}));

// ===================== DOWNLOAD LOGS =====================
export const downloadLogs = mysqlTable("download_logs", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).references(() => orders.id).notNull(),
  orderItemId: bigint("order_item_id", { mode: "number", unsigned: true }).references(() => orderItems.id).notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
  fileUrl: varchar("file_url", { length: 500 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================== ORDERS =====================
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  customerId: bigint("customer_id", { mode: "number", unsigned: true }).references(() => users.id),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  // Billing
  billingName: varchar("billing_name", { length: 255 }),
  billingEmail: varchar("billing_email", { length: 320 }),
  billingAddress: varchar("billing_address", { length: 500 }),
  billingCity: varchar("billing_city", { length: 100 }),
  billingZip: varchar("billing_zip", { length: 20 }),
  billingCountry: varchar("billing_country", { length: 2 }),
  billingVatId: varchar("billing_vat_id", { length: 50 }),
  // Amounts
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  // Status
  status: mysqlEnum("status", ["pending", "paid", "completed", "cancelled", "refunded"]).notNull().default("pending"),
  paymentMethod: mysqlEnum("payment_method", ["stripe", "paypal", "crypto", "free"]).notNull(),
  paymentStatus: mysqlEnum("payment_status", ["pending", "succeeded", "failed", "refunded"]).notNull().default("pending"),
  // Payment IDs
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeSessionId: varchar("stripe_session_id", { length: 255 }),
  paypalOrderId: varchar("paypal_order_id", { length: 255 }),
  paypalCaptureId: varchar("paypal_capture_id", { length: 255 }),
  // Coupon
  couponCode: varchar("coupon_code", { length: 50 }),
  // Affiliate
  sellerId: bigint("seller_id", { mode: "number", unsigned: true }).references(() => users.id),
  affiliateId: bigint("affiliate_id", { mode: "number", unsigned: true }).references(() => users.id),
  affiliateCommission: decimal("affiliate_commission", { precision: 10, scale: 2 }).default("0"),
  // Fraud
  ipAddress: varchar("ip_address", { length: 45 }),
  fraudScore: int("fraud_score").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (t) => ({
  customerIdx: index("customer_idx").on(t.customerId),
  statusIdx: index("status_idx").on(t.status),
  createdAtIdx: index("created_at_idx").on(t.createdAt),
}));

// ===================== ORDER ITEMS =====================
export const orderItems = mysqlTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).references(() => orders.id).notNull(),
  productId: bigint("product_id", { mode: "number", unsigned: true }).references(() => products.id).notNull(),
  variantId: bigint("variant_id", { mode: "number", unsigned: true }).references(() => productVariants.id),
  productName: varchar("product_name", { length: 255 }).notNull(),
  quantity: int("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  licenseKey: varchar("license_key", { length: 500 }),
  fileUrl: varchar("file_url", { length: 500 }),
  downloadCount: int("download_count").notNull().default(0),
  downloadLimit: int("download_limit").default(-1),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================== PAYMENT LOGS =====================
export const paymentLogs = mysqlTable("payment_logs", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).references(() => orders.id),
  event: varchar("event", { length: 100 }).notNull(),
  provider: mysqlEnum("provider", ["stripe", "paypal", "crypto", "system"]).notNull(),
  status: mysqlEnum("status", ["success", "failed", "pending"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }),
  externalId: varchar("external_id", { length: 255 }),
  payload: json("payload"),
  errorMessage: text("error_message"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  orderIdx: index("order_idx").on(t.orderId),
  createdAtIdx: index("created_at_idx").on(t.createdAt),
}));

// ===================== DELIVERY LOGS =====================
export const deliveryLogs = mysqlTable("delivery_logs", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).references(() => orders.id).notNull(),
  orderItemId: bigint("order_item_id", { mode: "number", unsigned: true }).references(() => orderItems.id).notNull(),
  type: mysqlEnum("type", ["file", "license_key", "service", "subscription"]).notNull(),
  status: mysqlEnum("status", ["pending", "delivered", "failed", "cancelled"]).notNull().default("pending"),
  deliveredAt: timestamp("delivered_at"),
  details: json("details"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  orderIdx: index("order_idx").on(t.orderId),
  statusIdx: index("status_idx").on(t.status),
}));

// ===================== CART ITEMS =====================
export const cartItems = mysqlTable("cart_items", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  productId: bigint("product_id", { mode: "number", unsigned: true }).references(() => products.id).notNull(),
  variantId: bigint("variant_id", { mode: "number", unsigned: true }).references(() => productVariants.id),
  quantity: int("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  sessionIdx: index("session_idx").on(t.sessionId),
}));

// ===================== REVIEWS =====================
export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  productId: bigint("product_id", { mode: "number", unsigned: true }).references(() => products.id).notNull(),
  customerId: bigint("customer_id", { mode: "number", unsigned: true }).references(() => users.id),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================== COUPONS =====================
export const coupons = mysqlTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  type: mysqlEnum("type", ["percentage", "fixed"]).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  maxUses: int("max_uses").default(-1),
  usedCount: int("used_count").notNull().default(0),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }).default("0"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: bigint("created_by", { mode: "number", unsigned: true }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================== TICKETS =====================
export const tickets = mysqlTable("tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 50 }).notNull().unique(),
  customerId: bigint("customer_id", { mode: "number", unsigned: true }).references(() => users.id),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).references(() => orders.id),
  subject: varchar("subject", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["general", "technical", "billing", "refund"]).notNull().default("general"),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).notNull().default("open"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).notNull().default("medium"),
  sellerId: bigint("seller_id", { mode: "number", unsigned: true }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (t) => ({
  statusIdx: index("status_idx").on(t.status),
  customerIdx: index("customer_idx").on(t.customerId),
}));

// ===================== TICKET MESSAGES =====================
export const ticketMessages = mysqlTable("ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: bigint("ticket_id", { mode: "number", unsigned: true }).references(() => tickets.id).notNull(),
  senderId: bigint("sender_id", { mode: "number", unsigned: true }).references(() => users.id),
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  senderRole: mysqlEnum("sender_role", ["customer", "admin", "seller"]).notNull(),
  message: text("message").notNull(),
  attachments: json("attachments").$type<{ name: string; url: string; size: number }[]>(),
  isInternal: boolean("is_internal").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================== SHOP SETTINGS =====================
export const shopSettings = mysqlTable("shop_settings", {
  id: serial("id").primaryKey(),
  shopName: varchar("shop_name", { length: 255 }).notNull().default("DigiSell"),
  shopSlug: varchar("shop_slug", { length: 255 }).unique(),
  shopDescription: text("shop_description"),
  logo: varchar("logo", { length: 500 }),
  banner: varchar("banner", { length: 500 }),
  favicon: varchar("favicon", { length: 500 }),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  timezone: varchar("timezone", { length: 100 }).notNull().default("Europe/Berlin"),
  language: varchar("language", { length: 10 }).notNull().default("de"),
  feePercentage: decimal("fee_percentage", { precision: 5, scale: 2 }).notNull().default("5.00"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  taxIncluded: boolean("tax_included").notNull().default(false),
  stripePublicKey: varchar("stripe_public_key", { length: 255 }),
  stripeSecretKey: varchar("stripe_secret_key", { length: 255 }),
  stripeWebhookSecret: varchar("stripe_webhook_secret", { length: 255 }),
  paypalClientId: varchar("paypal_client_id", { length: 255 }),
  paypalSecret: varchar("paypal_secret", { length: 255 }),
  paypalMode: mysqlEnum("paypal_mode", ["sandbox", "live"]).default("sandbox"),
  cryptoBtcAddress: varchar("crypto_btc_address", { length: 255 }),
  cryptoEthAddress: varchar("crypto_eth_address", { length: 255 }),
  cryptoSolAddress: varchar("crypto_sol_address", { length: 255 }),
  smtpHost: varchar("smtp_host", { length: 255 }),
  smtpPort: int("smtp_port").default(587),
  smtpUser: varchar("smtp_user", { length: 255 }),
  smtpPass: varchar("smtp_pass", { length: 255 }),
  smtpFrom: varchar("smtp_from", { length: 255 }),
  theme: mysqlEnum("theme", ["dark", "light", "auto"]).notNull().default("dark"),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  // S3 Storage
  s3Endpoint: varchar("s3_endpoint", { length: 255 }),
  s3Bucket: varchar("s3_bucket", { length: 255 }),
  s3Region: varchar("s3_region", { length: 50 }),
  s3AccessKey: varchar("s3_access_key", { length: 255 }),
  s3SecretKey: varchar("s3_secret_key", { length: 255 }),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ===================== FRAUD RULES =====================
export const fraudRules = mysqlTable("fraud_rules", {
  id: serial("id").primaryKey(),
  type: mysqlEnum("type", ["ip", "email", "domain", "country", "device"]).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  reason: text("reason"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================== AFFILIATE PROGRAMS =====================
export const affiliates = mysqlTable("affiliates", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  referralCode: varchar("referral_code", { length: 50 }).notNull().unique(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("10.00"),
  totalEarned: decimal("total_earned", { precision: 10, scale: 2 }).notNull().default("0"),
  pendingPayout: decimal("pending_payout", { precision: 10, scale: 2 }).notNull().default("0"),
  totalPaidOut: decimal("total_paid_out", { precision: 10, scale: 2 }).notNull().default("0"),
  status: mysqlEnum("status", ["active", "inactive", "pending"]).notNull().default("pending"),
  payoutMethod: mysqlEnum("payout_method", ["paypal", "bank", "crypto"]),
  payoutDetails: json("payout_details"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ===================== AFFILIATE CLICKS =====================
export const affiliateClicks = mysqlTable("affiliate_clicks", {
  id: serial("id").primaryKey(),
  affiliateId: bigint("affiliate_id", { mode: "number", unsigned: true }).references(() => affiliates.id).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  referrer: varchar("referrer", { length: 500 }),
  landingPage: varchar("landing_page", { length: 500 }),
  converted: boolean("converted").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  affiliateIdx: index("affiliate_idx").on(t.affiliateId),
  createdAtIdx: index("created_at_idx").on(t.createdAt),
}));

// ===================== AFFILIATE COMMISSIONS =====================
export const affiliateCommissions = mysqlTable("affiliate_commissions", {
  id: serial("id").primaryKey(),
  affiliateId: bigint("affiliate_id", { mode: "number", unsigned: true }).references(() => affiliates.id).notNull(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).references(() => orders.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "paid", "rejected"]).notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================== AFFILIATE PAYOUTS =====================
export const affiliatePayouts = mysqlTable("affiliate_payouts", {
  id: serial("id").primaryKey(),
  affiliateId: bigint("affiliate_id", { mode: "number", unsigned: true }).references(() => affiliates.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: mysqlEnum("method", ["paypal", "bank", "crypto"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).notNull().default("pending"),
  reference: varchar("reference", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ===================== SUBSCRIPTIONS =====================
export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  customerId: bigint("customer_id", { mode: "number", unsigned: true }).references(() => users.id).notNull(),
  productId: bigint("product_id", { mode: "number", unsigned: true }).references(() => products.id).notNull(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).references(() => orders.id),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "past_due", "trialing"]).notNull().default("active"),
  interval: mysqlEnum("interval", ["monthly", "yearly", "custom"]).notNull(),
  intervalDays: int("interval_days"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  paypalSubscriptionId: varchar("paypal_subscription_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (t) => ({
  customerIdx: index("customer_idx").on(t.customerId),
  statusIdx: index("status_idx").on(t.status),
  periodEndIdx: index("period_end_idx").on(t.currentPeriodEnd),
}));

// ===================== WEBHOOKS =====================
export const webhooks = mysqlTable("webhooks", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  secret: varchar("secret", { length: 255 }),
  events: json("events").$type<string[]>().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  failureCount: int("failure_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================== WEBHOOK LOGS =====================
export const webhookLogs = mysqlTable("webhook_logs", {
  id: serial("id").primaryKey(),
  webhookId: bigint("webhook_id", { mode: "number", unsigned: true }).references(() => webhooks.id, { onDelete: "cascade" }).notNull(),
  event: varchar("event", { length: 100 }).notNull(),
  payload: json("payload"),
  responseStatus: int("response_status"),
  responseBody: text("response_body"),
  duration: int("duration"),
  success: boolean("success").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================== SYSTEM LOGS =====================
export const systemLogs = mysqlTable("system_logs", {
  id: serial("id").primaryKey(),
  level: mysqlEnum("level", ["info", "warn", "error", "debug"]).notNull().default("info"),
  category: varchar("category", { length: 100 }).notNull(),
  message: text("message").notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
  ipAddress: varchar("ip_address", { length: 45 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  levelIdx: index("level_idx").on(t.level),
  categoryIdx: index("category_idx").on(t.category),
  createdAtIdx: index("created_at_idx").on(t.createdAt),
}));

// ===================== VISITOR STATS =====================
export const visitorStats = mysqlTable("visitor_stats", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull(),
  pageViews: int("page_views").notNull().default(0),
  uniqueVisitors: int("unique_visitors").notNull().default(0),
  orders: int("orders").notNull().default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (t) => ({
  dateIdx: uniqueIndex("date_idx").on(t.date),
}));

// ===================== SHOPS =====================
export const shops = mysqlTable("shops", {
  id: serial("id").primaryKey(),
  ownerId: bigint("owner_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  logo: varchar("logo", { length: 500 }),
  banner: varchar("banner", { length: 500 }),
  category: varchar("category", { length: 100 }).default("general"),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  status: mysqlEnum("status", ["active", "suspended", "pending"]).notNull().default("active"),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  totalOrders: int("total_orders").notNull().default(0),
  totalProducts: int("total_products").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (t) => ({
  slugIdx: index("shop_slug_idx").on(t.slug),
  ownerIdx: index("shop_owner_idx").on(t.ownerId),
  statusIdx: index("shop_status_idx").on(t.status),
}));

// ===================== REPORTS =====================
export const reports = mysqlTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: bigint("reporter_id", { mode: "number", unsigned: true }).references(() => users.id),
  reporterEmail: varchar("reporter_email", { length: 255 }),
  targetType: mysqlEnum("target_type", ["user", "shop", "product", "review"]).notNull(),
  targetId: bigint("target_id", { mode: "number", unsigned: true }).notNull(),
  reason: mysqlEnum("reason", ["spam", "fraud", "inappropriate", "fake", "other"]).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "reviewed", "resolved", "dismissed"]).notNull().default("pending"),
  resolvedBy: bigint("resolved_by", { mode: "number", unsigned: true }).references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  targetIdx: index("report_target_idx").on(t.targetType, t.targetId),
  statusIdx: index("report_status_idx").on(t.status),
}));

// ===================== LOGIN LOGS =====================
export const loginLogs = mysqlTable("login_logs", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }),
  success: boolean("success").notNull().default(false),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  country: varchar("country", { length: 2 }),
  failReason: varchar("fail_reason", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userIdx: index("login_user_idx").on(t.userId),
  createdAtIdx: index("login_created_idx").on(t.createdAt),
}));

// ===================== ADMIN ROLES =====================
export const adminRoles = mysqlTable("admin_roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  permissions: json("permissions").$type<string[]>().notNull().default([]),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ===================== USER ROLES (pivot) =====================
export const userAdminRoles = mysqlTable("user_admin_roles", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  roleId: bigint("role_id", { mode: "number", unsigned: true }).references(() => adminRoles.id, { onDelete: "cascade" }).notNull(),
  assignedBy: bigint("assigned_by", { mode: "number", unsigned: true }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userRoleIdx: index("user_role_idx").on(t.userId, t.roleId),
}));

// ===================== MODERATION LOGS =====================
export const moderationLogs = mysqlTable("moderation_logs", {
  id: serial("id").primaryKey(),
  adminId: bigint("admin_id", { mode: "number", unsigned: true }).references(() => users.id).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: mysqlEnum("target_type", ["user", "shop", "product", "order", "ticket", "review"]).notNull(),
  targetId: bigint("target_id", { mode: "number", unsigned: true }).notNull(),
  reason: text("reason"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  adminIdx: index("mod_admin_idx").on(t.adminId),
  targetIdx: index("mod_target_idx").on(t.targetType, t.targetId),
  createdAtIdx: index("mod_created_idx").on(t.createdAt),
}));

// ===================== TYPE EXPORTS =====================
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type ProductFile = typeof productFiles.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type ShopSetting = typeof shopSettings.$inferSelect;
export type FraudRule = typeof fraudRules.$inferSelect;
export type LicenseKey = typeof licenseKeys.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type Affiliate = typeof affiliates.$inferSelect;
export type AffiliateClick = typeof affiliateClicks.$inferSelect;
export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;
export type AffiliatePayout = typeof affiliatePayouts.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type WebhookLog = typeof webhookLogs.$inferSelect;
export type SystemLog = typeof systemLogs.$inferSelect;
export type PaymentLog = typeof paymentLogs.$inferSelect;
export type DownloadLog = typeof downloadLogs.$inferSelect;
export type DeliveryLog = typeof deliveryLogs.$inferSelect;
export type VisitorStat = typeof visitorStats.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type LoginLog = typeof loginLogs.$inferSelect;
export type AdminRole = typeof adminRoles.$inferSelect;
export type UserAdminRole = typeof userAdminRoles.$inferSelect;
export type ModerationLog = typeof moderationLogs.$inferSelect;

// ===================== PLATFORM SUBSCRIPTIONS (Seller-Abos) =====================
export const platformSubscriptions = mysqlTable("platform_subscriptions", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  planName: mysqlEnum("plan_name", ["free", "premium", "business", "enterprise"]).notNull(),
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).notNull().default("active"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  grantedByAdminId: bigint("granted_by_admin_id", { mode: "number", unsigned: true }).references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (t) => ({
  userIdx: index("platform_sub_user_idx").on(t.userId),
  statusIdx: index("platform_sub_status_idx").on(t.status),
}));

// ===================== SUBSCRIPTION AUDIT LOGS =====================
export const subscriptionAuditLogs = mysqlTable("subscription_audit_logs", {
  id: serial("id").primaryKey(),
  adminId: bigint("admin_id", { mode: "number", unsigned: true }).references(() => users.id).notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id).notNull(),
  action: varchar("action", { length: 100 }).notNull(), // e.g. "plan_changed", "limit_changed", "premium_granted"
  oldValues: json("old_values"),
  newValues: json("new_values"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  adminIdx: index("audit_admin_idx").on(t.adminId),
  userIdx: index("audit_user_idx").on(t.userId),
  createdAtIdx: index("audit_created_at_idx").on(t.createdAt),
}));

export type PlatformSubscription = typeof platformSubscriptions.$inferSelect;
export type SubscriptionAuditLog = typeof subscriptionAuditLogs.$inferSelect;

// ===================== PLATFORM CREDITS =====================
export const platformCredits = mysqlTable("platform_credits", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (t) => ({
  userIdx: index("platform_credits_user_idx").on(t.userId),
}));

export const platformCreditTransactions = mysqlTable("platform_credit_transactions", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["credit", "debit", "purchase"]).notNull().default("credit"),
  description: varchar("description", { length: 500 }),
  grantedByAdminId: bigint("granted_by_admin_id", { mode: "number", unsigned: true }).references(() => users.id),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userIdx: index("platform_credit_tx_user_idx").on(t.userId),
  createdAtIdx: index("platform_credit_tx_created_at_idx").on(t.createdAt),
}));

// ===================== SHOP CREDITS =====================
export const shopCredits = mysqlTable("shop_credits", {
  id: serial("id").primaryKey(),
  shopId: bigint("shop_id", { mode: "number", unsigned: true }).references(() => shops.id, { onDelete: "cascade" }).notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (t) => ({
  shopUserIdx: index("shop_credits_shop_user_idx").on(t.shopId, t.userId),
  userIdx: index("shop_credits_user_idx").on(t.userId),
  shopIdx: index("shop_credits_shop_idx").on(t.shopId),
}));

export const shopCreditTransactions = mysqlTable("shop_credit_transactions", {
  id: serial("id").primaryKey(),
  shopId: bigint("shop_id", { mode: "number", unsigned: true }).references(() => shops.id, { onDelete: "cascade" }).notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["credit", "debit", "purchase"]).notNull().default("credit"),
  description: varchar("description", { length: 500 }),
  grantedBySellerId: bigint("granted_by_seller_id", { mode: "number", unsigned: true }).references(() => users.id),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  shopUserIdx: index("shop_credit_tx_shop_user_idx").on(t.shopId, t.userId),
  userIdx: index("shop_credit_tx_user_idx").on(t.userId),
  createdAtIdx: index("shop_credit_tx_created_at_idx").on(t.createdAt),
}));

export type PlatformCredit = typeof platformCredits.$inferSelect;
export type PlatformCreditTransaction = typeof platformCreditTransactions.$inferSelect;
export type ShopCredit = typeof shopCredits.$inferSelect;
export type ShopCreditTransaction = typeof shopCreditTransactions.$inferSelect;

// ===================== BLOCKLISTS =====================
export const blocklists = mysqlTable("blocklists", {
  id: serial("id").primaryKey(),
  type: mysqlEnum("type", ["ip", "email", "domain"]).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  reason: text("reason"),
  createdBy: bigint("created_by", { mode: "number", unsigned: true }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  typeIdx: index("type_idx").on(t.type),
  valueIdx: index("value_idx").on(t.value),
}));
export type Blocklist = typeof blocklists.$inferSelect;
