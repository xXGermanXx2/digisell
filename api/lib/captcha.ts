/**
 * CAPTCHA Verification Utility
 * Supports hCaptcha and Cloudflare Turnstile
 */

export type CaptchaProvider = "hcaptcha" | "turnstile" | "none";

interface CaptchaVerifyResult {
  success: boolean;
  errorCodes?: string[];
}

export async function verifyCaptcha(
  token: string,
  provider: CaptchaProvider = "hcaptcha",
  remoteIp?: string
): Promise<CaptchaVerifyResult> {
  if (provider === "none" || process.env.NODE_ENV === "test") {
    return { success: true };
  }

  if (!token) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }

  try {
    if (provider === "hcaptcha") {
      const secret = process.env.HCAPTCHA_SECRET_KEY;
      if (!secret) {
        console.warn("[CAPTCHA] HCAPTCHA_SECRET_KEY not set, skipping verification.");
        return { success: true };
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

    if (provider === "turnstile") {
      const secret = process.env.TURNSTILE_SECRET_KEY;
      if (!secret) {
        console.warn("[CAPTCHA] TURNSTILE_SECRET_KEY not set, skipping verification.");
        return { success: true };
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
