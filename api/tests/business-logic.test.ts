import { describe, it, expect } from "vitest";

// ── Business Logic Helpers ────────────────────────────────────────────────────

type ProductType = "digital" | "license" | "file" | "service" | "subscription";

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

interface Coupon {
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount?: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: Date;
  isActive: boolean;
}

function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function applyCoupon(subtotal: number, coupon: Coupon): { discount: number; valid: boolean; reason?: string } {
  if (!coupon.isActive) return { discount: 0, valid: false, reason: "Gutschein ist inaktiv." };
  if (coupon.usedCount >= coupon.maxUses) return { discount: 0, valid: false, reason: "Gutschein-Limit erreicht." };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { discount: 0, valid: false, reason: "Gutschein abgelaufen." };
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return { discount: 0, valid: false, reason: `Mindestbestellwert: €${coupon.minOrderAmount}` };
  }

  const discount = coupon.type === "percentage"
    ? Math.min(subtotal, (subtotal * coupon.value) / 100)
    : Math.min(subtotal, coupon.value);

  return { discount: parseFloat(discount.toFixed(2)), valid: true };
}

function isProductInStock(stock: number, quantity: number): boolean {
  if (stock === -1) return true; // unlimited
  return stock >= quantity;
}

function calculateAffiliateCommission(orderTotal: number, commissionRate: number): number {
  return parseFloat(((orderTotal * commissionRate) / 100).toFixed(2));
}

function formatOrderStatus(status: string): string {
  const labels: Record<string, string> = {
    pending: "Ausstehend",
    paid: "Bezahlt",
    completed: "Abgeschlossen",
    cancelled: "Storniert",
    refunded: "Erstattet",
  };
  return labels[status] ?? status;
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[äöü]/g, c => ({ ä: "ae", ö: "oe", ü: "ue" }[c] ?? c))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Cart Total Calculation", () => {
  it("should calculate total for single item", () => {
    const items: CartItem[] = [{ productId: 1, name: "Product A", price: 29.99, quantity: 1 }];
    expect(calculateCartTotal(items)).toBeCloseTo(29.99);
  });

  it("should calculate total for multiple items", () => {
    const items: CartItem[] = [
      { productId: 1, name: "Product A", price: 10, quantity: 2 },
      { productId: 2, name: "Product B", price: 5, quantity: 3 },
    ];
    expect(calculateCartTotal(items)).toBe(35);
  });

  it("should return 0 for empty cart", () => {
    expect(calculateCartTotal([])).toBe(0);
  });

  it("should handle quantity > 1", () => {
    const items: CartItem[] = [{ productId: 1, name: "License", price: 9.99, quantity: 5 }];
    expect(calculateCartTotal(items)).toBeCloseTo(49.95);
  });
});

describe("Coupon Application", () => {
  const validCoupon: Coupon = {
    type: "percentage",
    value: 20,
    maxUses: 100,
    usedCount: 5,
    isActive: true,
  };

  it("should apply percentage coupon", () => {
    const result = applyCoupon(100, validCoupon);
    expect(result.valid).toBe(true);
    expect(result.discount).toBe(20);
  });

  it("should apply fixed coupon", () => {
    const fixedCoupon: Coupon = { ...validCoupon, type: "fixed", value: 15 };
    const result = applyCoupon(100, fixedCoupon);
    expect(result.valid).toBe(true);
    expect(result.discount).toBe(15);
  });

  it("should reject inactive coupon", () => {
    const inactive: Coupon = { ...validCoupon, isActive: false };
    const result = applyCoupon(100, inactive);
    expect(result.valid).toBe(false);
  });

  it("should reject expired coupon", () => {
    const expired: Coupon = { ...validCoupon, expiresAt: new Date("2020-01-01") };
    const result = applyCoupon(100, expired);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("abgelaufen");
  });

  it("should reject coupon when max uses reached", () => {
    const maxed: Coupon = { ...validCoupon, maxUses: 10, usedCount: 10 };
    const result = applyCoupon(100, maxed);
    expect(result.valid).toBe(false);
  });

  it("should reject coupon below minimum order amount", () => {
    const withMin: Coupon = { ...validCoupon, minOrderAmount: 50 };
    const result = applyCoupon(30, withMin);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Mindestbestellwert");
  });

  it("should not discount more than order total", () => {
    const bigFixed: Coupon = { ...validCoupon, type: "fixed", value: 200 };
    const result = applyCoupon(50, bigFixed);
    expect(result.discount).toBe(50);
  });
});

describe("Stock Management", () => {
  it("should allow purchase when in stock", () => {
    expect(isProductInStock(10, 3)).toBe(true);
  });

  it("should deny purchase when out of stock", () => {
    expect(isProductInStock(2, 5)).toBe(false);
  });

  it("should allow unlimited stock (-1)", () => {
    expect(isProductInStock(-1, 9999)).toBe(true);
  });

  it("should allow exact stock match", () => {
    expect(isProductInStock(5, 5)).toBe(true);
  });

  it("should deny when stock is 0", () => {
    expect(isProductInStock(0, 1)).toBe(false);
  });
});

describe("Affiliate Commission", () => {
  it("should calculate 10% commission", () => {
    expect(calculateAffiliateCommission(100, 10)).toBe(10);
  });

  it("should calculate 5% commission", () => {
    expect(calculateAffiliateCommission(200, 5)).toBe(10);
  });

  it("should round to 2 decimal places", () => {
    const commission = calculateAffiliateCommission(33.33, 15);
    expect(commission.toString().split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });

  it("should return 0 for 0% commission", () => {
    expect(calculateAffiliateCommission(100, 0)).toBe(0);
  });
});

describe("Order Status Labels", () => {
  it("should return German labels", () => {
    expect(formatOrderStatus("pending")).toBe("Ausstehend");
    expect(formatOrderStatus("paid")).toBe("Bezahlt");
    expect(formatOrderStatus("completed")).toBe("Abgeschlossen");
    expect(formatOrderStatus("cancelled")).toBe("Storniert");
    expect(formatOrderStatus("refunded")).toBe("Erstattet");
  });

  it("should return original for unknown status", () => {
    expect(formatOrderStatus("unknown_status")).toBe("unknown_status");
  });
});

describe("Slug Generation", () => {
  it("should generate valid slugs", () => {
    expect(generateSlug("Premium Software Lizenz")).toBe("premium-software-lizenz");
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it("should handle German umlauts", () => {
    expect(generateSlug("Schöne Übersicht")).toBe("schoene-uebersicht");
  });

  it("should remove leading and trailing hyphens", () => {
    const slug = generateSlug("  Test Product  ");
    expect(slug).not.toMatch(/^-|-$/);
  });

  it("should validate correct slugs", () => {
    expect(isValidSlug("hello-world")).toBe(true);
    expect(isValidSlug("product-123")).toBe(true);
    expect(isValidSlug("single")).toBe(true);
  });

  it("should reject invalid slugs", () => {
    expect(isValidSlug("Hello World")).toBe(false);
    expect(isValidSlug("-leading-hyphen")).toBe(false);
    expect(isValidSlug("trailing-hyphen-")).toBe(false);
    expect(isValidSlug("double--hyphen")).toBe(false);
  });
});
