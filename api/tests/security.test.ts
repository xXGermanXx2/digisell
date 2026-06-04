import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";

// ── HMAC Webhook Signature ────────────────────────────────────────────────────

function signWebhookPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = signWebhookPayload(payload, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

// ── Rate Limiting ─────────────────────────────────────────────────────────────

class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(private maxRequests: number, private windowMs: number) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const existing = this.requests.get(key) ?? [];
    const recent = existing.filter(t => t > windowStart);

    if (recent.length >= this.maxRequests) return false;

    recent.push(now);
    this.requests.set(key, recent);
    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const existing = this.requests.get(key) ?? [];
    const recent = existing.filter(t => t > windowStart);
    return Math.max(0, this.maxRequests - recent.length);
  }
}

// ── Input Sanitization ────────────────────────────────────────────────────────

function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function isSuspiciousInput(input: string): boolean {
  const patterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /exec\s*\(/i,
  ];
  return patterns.some(p => p.test(input));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Webhook HMAC Signature", () => {
  const secret = "test-webhook-secret-key";
  const payload = JSON.stringify({ event: "order.completed", orderId: 42 });

  it("should generate a valid HMAC signature", () => {
    const sig = signWebhookPayload(payload, secret);
    expect(sig).toBeDefined();
    expect(sig).toHaveLength(64); // SHA-256 hex = 64 chars
  });

  it("should verify a correct signature", () => {
    const sig = signWebhookPayload(payload, secret);
    expect(verifyWebhookSignature(payload, sig, secret)).toBe(true);
  });

  it("should reject an incorrect signature", () => {
    const wrongSig = "a".repeat(64);
    expect(verifyWebhookSignature(payload, wrongSig, secret)).toBe(false);
  });

  it("should reject signature with wrong secret", () => {
    const sig = signWebhookPayload(payload, "wrong-secret");
    expect(verifyWebhookSignature(payload, sig, secret)).toBe(false);
  });

  it("should reject signature for tampered payload", () => {
    const sig = signWebhookPayload(payload, secret);
    const tampered = payload.replace("42", "99");
    expect(verifyWebhookSignature(tampered, sig, secret)).toBe(false);
  });

  it("should produce different signatures for different payloads", () => {
    const sig1 = signWebhookPayload('{"event":"a"}', secret);
    const sig2 = signWebhookPayload('{"event":"b"}', secret);
    expect(sig1).not.toBe(sig2);
  });
});

describe("Rate Limiter", () => {
  it("should allow requests within limit", () => {
    const limiter = new SimpleRateLimiter(5, 60000);
    for (let i = 0; i < 5; i++) {
      expect(limiter.isAllowed("user1")).toBe(true);
    }
  });

  it("should block requests exceeding limit", () => {
    const limiter = new SimpleRateLimiter(3, 60000);
    limiter.isAllowed("user1");
    limiter.isAllowed("user1");
    limiter.isAllowed("user1");
    expect(limiter.isAllowed("user1")).toBe(false);
  });

  it("should track different keys independently", () => {
    const limiter = new SimpleRateLimiter(2, 60000);
    limiter.isAllowed("user1");
    limiter.isAllowed("user1");
    expect(limiter.isAllowed("user1")).toBe(false);
    expect(limiter.isAllowed("user2")).toBe(true);
  });

  it("should return correct remaining requests", () => {
    const limiter = new SimpleRateLimiter(10, 60000);
    limiter.isAllowed("user1");
    limiter.isAllowed("user1");
    expect(limiter.getRemainingRequests("user1")).toBe(8);
  });
});

describe("Input Sanitization", () => {
  it("should escape HTML special characters", () => {
    expect(sanitizeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
    );
  });

  it("should escape ampersands", () => {
    expect(sanitizeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("should escape quotes", () => {
    expect(sanitizeHtml('"quoted"')).toBe("&quot;quoted&quot;");
  });

  it("should leave normal text unchanged", () => {
    expect(sanitizeHtml("Hello World 123")).toBe("Hello World 123");
  });
});

describe("Suspicious Input Detection", () => {
  it("should detect XSS attempts", () => {
    expect(isSuspiciousInput("<script>alert(1)</script>")).toBe(true);
    expect(isSuspiciousInput("javascript:void(0)")).toBe(true);
    expect(isSuspiciousInput('<img onload="evil()">>')).toBe(true);
  });

  it("should detect SQL injection attempts", () => {
    expect(isSuspiciousInput("1 UNION SELECT * FROM users")).toBe(true);
    expect(isSuspiciousInput("DROP TABLE orders")).toBe(true);
    expect(isSuspiciousInput("INSERT INTO users VALUES")).toBe(true);
  });

  it("should allow normal input", () => {
    expect(isSuspiciousInput("Hello, my name is Max!")).toBe(false);
    expect(isSuspiciousInput("Product price: €29.99")).toBe(false);
    expect(isSuspiciousInput("user@example.com")).toBe(false);
  });
});
