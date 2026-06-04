import { eq } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import type { User } from "@db/schema";
import { env } from "./env";

// Simple JWT verification without external library dependency
function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

async function verifyJWT(token: string, secret: string): Promise<{ sub: string; unionId: string; exp: number } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const data = `${header}.${payload}`;

    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );

    const sigBytes = Buffer.from(base64UrlDecode(signature), "binary");
    const valid = await crypto.subtle.verify("HMAC", cryptoKey, sigBytes, encoder.encode(data));
    if (!valid) return null;

    const decoded = JSON.parse(base64UrlDecode(payload));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;

    return decoded;
  } catch {
    return null;
  }
}

export async function authenticateLocalRequest(headers: Headers): Promise<User | undefined> {
  // Check Authorization header (Bearer token)
  const authHeader = headers.get("authorization");
  let token: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    // Check cookie
    const cookieHeader = headers.get("cookie") ?? "";
    const match = cookieHeader.match(/ds_session=([^;]+)/);
    if (match) token = decodeURIComponent(match[1]);
  }

  if (!token) return undefined;

  const payload = await verifyJWT(token, env.jwtSecret);
  if (!payload?.unionId) return undefined;

  const db = getDb();
  const user = await db.query.users.findFirst({ where: eq(users.unionId, payload.unionId) });
  if (!user || user.status === "blocked") return undefined;

  return user;
}

export async function signJWT(payload: Record<string, unknown>, expiresInSeconds = 86400): Promise<string> {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  })).toString("base64url");

  const data = `${header}.${body}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(env.jwtSecret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  const sig = Buffer.from(sigBuffer).toString("base64url");

  return `${data}.${sig}`;
}
