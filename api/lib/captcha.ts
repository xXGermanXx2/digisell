/**
 * CAPTCHA Verification Utility
 * Supports hCaptcha and Cloudflare Turnstile.
 * The verifier accepts persisted admin settings first and falls back to env vars.
 */

export type CaptchaProvider = "hcaptcha" | "turnstile" | "none";

interface CaptchaVerifyResult {
  success: boolean;
  errorCodes?: string[];
}

export interface CaptchaRuntimeConfig {
  enabled?: boolean | null;
  provider?: CaptchaProvider | null;
  secretKey?: string | null;
}

export async function verifyCaptcha(
  token: string,
  provider: CaptchaProvider = "hcaptcha",
  remoteIp?: string,
  runtimeConfig?: CaptchaRuntimeConfig
): Promise<CaptchaVerifyResult> {
  const effectiveProvider = runtimeConfig?.provider ?? provider;
  const isEnabled = runtimeConfig?.enabled ?? effectiveProvider !== "none";

  if (!isEnabled || effectiveProvider === "none" || process.env.NODE_ENV === "test") {
    return { success: true };
  }

  if (!token) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }

  try {
    if (effectiveProvider === "hcaptcha") {
      const secret = runtimeConfig?.secretKey || process.env.HCAPTCHA_SECRET_KEY;
      if (!secret) {
        console.warn("[CAPTCHA] hCaptcha secret not set, skipping verification.");
        return { success: true, errorCodes: ["missing-secret"] };
      }

      const body = new URLSearchParams({ secret, response: token });
      if (remoteIp) body.append("remoteip", remoteIp);

      const res = await fetch("https://hcaptcha.com/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      const data = await res.json() as { success: boolean; "error-codes"?: string[] };
      return { success: data.success, errorCodes: data["error-codes"] };
    }

    if (effectiveProvider === "turnstile") {
      const secret = runtimeConfig?.secretKey || process.env.TURNSTILE_SECRET_KEY;
      if (!secret) {
        console.warn("[CAPTCHA] Turnstile secret not set, skipping verification.");
        return { success: true, errorCodes: ["missing-secret"] };
      }

      const body = JSON.stringify({ secret, response: token, remoteip: remoteIp });
      const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      const data = await res.json() as { success: boolean; "error-codes"?: string[] };
      return { success: data.success, errorCodes: data["error-codes"] };
    }

    return { success: false, errorCodes: ["unknown-provider"] };
  } catch (err) {
    console.error("[CAPTCHA] Verification error:", err);
    return { success: false, errorCodes: ["network-error"] };
  }
}
