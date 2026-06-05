import { z } from "zod";
import * as bcrypt from "bcryptjs";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";
import * as cookie from "cookie";
import { eq, and, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, refreshTokens } from "@db/schema";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { signSessionToken, verifySessionToken } from "./kimi/session";
import { sendEmail, emailVerificationTemplate, passwordResetTemplate } from "./lib/email";
import { env } from "./lib/env";
import { Errors } from "@contracts/errors";

// ── helpers ──────────────────────────────────────────────────────────────────
function generateToken(len = 64): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let t = "";
  for (let i = 0; i < len; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

async function issueSession(c: any, userId: number, unionId: string) {
  const token = await signSessionToken({ unionId, clientId: env.appId || "local" });
  const cookieOpts = getSessionCookieOptions(c.req.headers);
  c.resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: cookieOpts.httpOnly,
      path: cookieOpts.path ?? "/",
      sameSite: (cookieOpts.sameSite?.toLowerCase() ?? "lax") as "lax" | "none" | "strict",
      secure: cookieOpts.secure,
      maxAge: Session.maxAgeMs / 1000,
    }),
  );

  // Refresh token
  const db = getDb();
  const refreshToken = generateToken(80);
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await db.insert(refreshTokens).values({ userId, token: refreshToken, expiresAt: expires });
  return { sessionToken: token, refreshToken };
}

// ── router ────────────────────────────────────────────────────────────────────
export const authRouter = createRouter({
  // ── me ──
  me: authedQuery.query((opts) => opts.ctx.user),

  // ── register ──
  register: publicQuery
    .input(z.object({
      name: z.string().min(2).max(100),
      email: z.string().email().max(320),
      password: z.string().min(8).max(128),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const existing = await db.query.users.findFirst({ where: eq(users.email, input.email) });
      if (existing) throw Errors.badRequest("Diese E-Mail ist bereits registriert.");

      const passwordHash = await bcrypt.hash(input.password, 12);
      const verifyToken = generateToken(64);
      const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const unionId = `local_${nanoid(21)}`;

      const result = await db.insert(users).values({
        unionId,
        name: input.name,
        email: input.email,
        passwordHash,
        role: "customer",
        status: "pending",
        emailVerified: false,
        emailVerifyToken: verifyToken,
        emailVerifyExpires: verifyExpires,
        lastSignInAt: new Date(),
      });

      const userId = Number(result[0].insertId);

      // Send verification email
      await sendEmail({
        to: input.email,
        subject: "E-Mail-Adresse bestätigen – DigiSell",
        html: emailVerificationTemplate(input.name, verifyToken, env.appUrl),
      });

      return { success: true, message: "Registrierung erfolgreich. Bitte bestätige deine E-Mail." };
    }),

  // ── login ──
  login: publicQuery
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
      twoFactorCode: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({ where: eq(users.email, input.email) });

      if (!user || !user.passwordHash) throw Errors.unauthorized("Ungültige E-Mail oder Passwort.");

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) throw Errors.unauthorized("Ungültige E-Mail oder Passwort.");

      if (user.status === "blocked") throw Errors.forbidden("Dein Konto wurde gesperrt.");

      // 2FA check
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        if (!input.twoFactorCode) {
          return { requiresTwoFactor: true };
        }
        const verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: "base32",
          token: input.twoFactorCode,
          window: 1,
        });
        // Check backup codes
        if (!verified) {
          const backupCodes = user.twoFactorBackupCodes ?? [];
          const backupIdx = backupCodes.indexOf(input.twoFactorCode);
          if (backupIdx === -1) throw Errors.unauthorized("Ungültiger 2FA-Code.");
          // Consume backup code
          backupCodes.splice(backupIdx, 1);
          await db.update(users).set({ twoFactorBackupCodes: backupCodes }).where(eq(users.id, user.id));
        }
      }

      await db.update(users).set({ lastSignInAt: new Date(), status: user.status === "pending" ? "active" : user.status }).where(eq(users.id, user.id));

      const { refreshToken } = await issueSession(ctx, user.id, user.unionId!);

      return { success: true, requiresTwoFactor: false, refreshToken, role: user.role };
    }),

  // ── logout ──
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path ?? "/",
        sameSite: (opts.sameSite?.toLowerCase() ?? "lax") as "lax" | "none" | "strict",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    // Revoke refresh tokens
    const db = getDb();
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, ctx.user!.id));
    return { success: true };
  }),

  // ── refresh token ──
  refresh: publicQuery
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const token = await db.query.refreshTokens.findFirst({
        where: and(
          eq(refreshTokens.token, input.refreshToken),
          gt(refreshTokens.expiresAt, new Date()),
        ),
        with: { user: true },
      });
      if (!token || !token.user) throw Errors.unauthorized("Ungültiger oder abgelaufener Refresh-Token.");

      // Rotate refresh token
      await db.delete(refreshTokens).where(eq(refreshTokens.id, token.id));
      const { refreshToken: newRefreshToken } = await issueSession(ctx, token.user.id, token.user.unionId!);

      return { success: true, refreshToken: newRefreshToken };
    }),

  // ── verify email ──
  verifyEmail: publicQuery
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.emailVerifyToken, input.token),
          gt(users.emailVerifyExpires, new Date()),
        ),
      });
      if (!user) throw Errors.badRequest("Ungültiger oder abgelaufener Bestätigungslink.");

      await db.update(users).set({
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
        status: "active",
      }).where(eq(users.id, user.id));

      return { success: true };
    }),

  // ── resend verification ──
  resendVerification: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({ where: eq(users.email, input.email) });
      if (!user || user.emailVerified) return { success: true }; // Silent

      const token = generateToken(64);
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.update(users).set({ emailVerifyToken: token, emailVerifyExpires: expires }).where(eq(users.id, user.id));

      await sendEmail({
        to: input.email,
        subject: "E-Mail bestätigen – DigiSell",
        html: emailVerificationTemplate(user.name ?? "", token, env.appUrl),
      });

      return { success: true };
    }),

  // ── forgot password ──
  forgotPassword: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({ where: eq(users.email, input.email) });
      if (!user) return { success: true }; // Silent – don't reveal existence

      const token = generateToken(64);
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await db.update(users).set({ passwordResetToken: token, passwordResetExpires: expires }).where(eq(users.id, user.id));

      await sendEmail({
        to: input.email,
        subject: "Passwort zurücksetzen – DigiSell",
        html: passwordResetTemplate(user.name ?? "", token, env.appUrl),
      });

      return { success: true };
    }),

  // ── reset password ──
  resetPassword: publicQuery
    .input(z.object({
      token: z.string(),
      password: z.string().min(8).max(128),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.passwordResetToken, input.token),
          gt(users.passwordResetExpires, new Date()),
        ),
      });
      if (!user) throw Errors.badRequest("Ungültiger oder abgelaufener Reset-Link.");

      const passwordHash = await bcrypt.hash(input.password, 12);
      await db.update(users).set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      }).where(eq(users.id, user.id));

      // Revoke all refresh tokens
      await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));

      return { success: true };
    }),

  // ── setup 2FA ──
  setup2FA: authedQuery.mutation(async ({ ctx }) => {
    const secret = speakeasy.generateSecret({ name: `DigiSell (${ctx.user!.email ?? ctx.user!.name})`, length: 20 });
    const db = getDb();
    await db.update(users).set({ twoFactorSecret: secret.base32 }).where(eq(users.id, ctx.user!.id));

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);
    return { secret: secret.base32, qrCode };
  }),

  // ── enable 2FA ──
  enable2FA: authedQuery
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({ where: eq(users.id, ctx.user!.id) });
      if (!user?.twoFactorSecret) throw Errors.badRequest("2FA wurde noch nicht eingerichtet.");

      const valid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: input.code,
        window: 1,
      });
      if (!valid) throw Errors.badRequest("Ungültiger Code.");

      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () => nanoid(10));
      await db.update(users).set({ twoFactorEnabled: true, twoFactorBackupCodes: backupCodes }).where(eq(users.id, user.id));

      return { success: true, backupCodes };
    }),

  // ── disable 2FA ──
  disable2FA: authedQuery
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({ where: eq(users.id, ctx.user!.id) });
      if (!user?.twoFactorEnabled || !user.twoFactorSecret) throw Errors.badRequest("2FA ist nicht aktiviert.");

      const valid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: input.code,
        window: 1,
      });
      if (!valid) throw Errors.badRequest("Ungültiger Code.");

      await db.update(users).set({ twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: null }).where(eq(users.id, user.id));
      return { success: true };
    }),
});
