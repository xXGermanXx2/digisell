import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  appId: optional("APP_ID"),
  appSecret: optional("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: optional("KIMI_AUTH_URL", "https://account.kimi.ai"),
  kimiOpenUrl: optional("KIMI_OPEN_URL", "https://kimi.ai"),
  ownerUnionId: optional("OWNER_UNION_ID"),
  // JWT
  jwtSecret: optional("JWT_SECRET", "dev_secret_change_in_production_min32chars"),
  sessionSecret: optional("SESSION_SECRET", "dev_session_change_in_production_32c"),
  // SMTP
  smtpHost: optional("SMTP_HOST"),
  smtpPort: parseInt(optional("SMTP_PORT", "587")),
  smtpUser: optional("SMTP_USER"),
  smtpPass: optional("SMTP_PASS"),
  smtpFrom: optional("SMTP_FROM", "DigiSell <noreply@digisell.app>"),
  // Stripe
  stripeSecretKey: optional("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
  // PayPal
  paypalClientId: optional("PAYPAL_CLIENT_ID"),
  paypalSecret: optional("PAYPAL_SECRET"),
  paypalMode: optional("PAYPAL_MODE", "sandbox") as "sandbox" | "live",
  // S3
  s3Endpoint: optional("S3_ENDPOINT"),
  s3Bucket: optional("S3_BUCKET", "digisell"),
  s3Region: optional("S3_REGION", "eu-central-1"),
  s3AccessKey: optional("S3_ACCESS_KEY"),
  s3SecretKey: optional("S3_SECRET_KEY"),
  // Redis
  redisUrl: optional("REDIS_URL", "redis://localhost:6379"),
  // App
  appUrl: optional("APP_URL", "http://localhost:3000"),
};
