import * as jose from "jose";
import { env } from "../lib/env";
import type { SessionPayload } from "./types";

const JWT_ALG = "HS256";

// Use appSecret if set, otherwise fall back to jwtSecret (always has a default)
function getJwtSecret(): string {
  const s = env.appSecret || env.jwtSecret;
  if (!s) throw new Error("No JWT secret configured. Set APP_SECRET or JWT_SECRET.");
  return s;
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const secret = new TextEncoder().encode(getJwtSecret());
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1 year")
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) {
    console.warn("[session] No token provided for verification.");
    return null;
  }
  try {
    const secret = new TextEncoder().encode(getJwtSecret());
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const { unionId, clientId } = payload;
    if (!unionId || !clientId) {
      console.warn("[session] JWT payload missing required fields.");
      return null;
    }
    return { unionId, clientId } as SessionPayload;
  } catch (error) {
    console.warn("[session] JWT verification failed:", error);
    return null;
  }
}
