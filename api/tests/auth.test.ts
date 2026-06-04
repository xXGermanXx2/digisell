import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `TKT-${timestamp}`;
}

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "ds_";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function calculateDiscount(
  price: number,
  couponType: "percentage" | "fixed",
  couponValue: number
): number {
  if (couponType === "percentage") {
    return Math.min(price, (price * couponValue) / 100);
  }
  return Math.min(price, couponValue);
}

function calculateTax(subtotal: number, taxRate: number): number {
  return parseFloat(((subtotal * taxRate) / 100).toFixed(2));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Password Hashing", () => {
  it("should hash a password", async () => {
    const hash = await hashPassword("SecureP@ss123");
    expect(hash).toBeDefined();
    expect(hash).not.toBe("SecureP@ss123");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("should verify correct password", async () => {
    const password = "MyPassword123!";
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const hash = await hashPassword("CorrectPassword");
    const result = await verifyPassword("WrongPassword", hash);
    expect(result).toBe(false);
  });

  it("should produce different hashes for same password", async () => {
    const password = "SamePassword123";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toBe(hash2);
  });
});

describe("Email Validation", () => {
  it("should accept valid emails", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("user+tag@example.co.uk")).toBe(true);
    expect(validateEmail("user.name@domain.org")).toBe(true);
  });

  it("should reject invalid emails", () => {
    expect(validateEmail("notanemail")).toBe(false);
    expect(validateEmail("@nodomain.com")).toBe(false);
    expect(validateEmail("noatsign.com")).toBe(false);
    expect(validateEmail("")).toBe(false);
  });
});

describe("Order Number Generation", () => {
  it("should generate order numbers with correct prefix", () => {
    const orderNumber = generateOrderNumber();
    expect(orderNumber.startsWith("ORD-")).toBe(true);
  });

  it("should generate unique order numbers", () => {
    const numbers = new Set(Array.from({ length: 100 }, generateOrderNumber));
    expect(numbers.size).toBe(100);
  });
});

describe("Ticket Number Generation", () => {
  it("should generate ticket numbers with correct prefix", () => {
    const ticketNumber = generateTicketNumber();
    expect(ticketNumber.startsWith("TKT-")).toBe(true);
  });
});

describe("API Key Generation", () => {
  it("should generate API keys with ds_ prefix", () => {
    const key = generateApiKey();
    expect(key.startsWith("ds_")).toBe(true);
  });

  it("should generate keys of correct length", () => {
    const key = generateApiKey();
    expect(key.length).toBe(35); // "ds_" (3) + 32 chars
  });

  it("should generate unique keys", () => {
    const keys = new Set(Array.from({ length: 50 }, generateApiKey));
    expect(keys.size).toBe(50);
  });
});

describe("Discount Calculation", () => {
  it("should calculate percentage discount correctly", () => {
    expect(calculateDiscount(100, "percentage", 20)).toBe(20);
    expect(calculateDiscount(50, "percentage", 10)).toBe(5);
  });

  it("should calculate fixed discount correctly", () => {
    expect(calculateDiscount(100, "fixed", 15)).toBe(15);
    expect(calculateDiscount(100, "fixed", 5)).toBe(5);
  });

  it("should not exceed product price for fixed discount", () => {
    expect(calculateDiscount(10, "fixed", 20)).toBe(10);
  });

  it("should not exceed product price for percentage discount", () => {
    expect(calculateDiscount(100, "percentage", 150)).toBe(100);
  });

  it("should handle zero discount", () => {
    expect(calculateDiscount(100, "percentage", 0)).toBe(0);
    expect(calculateDiscount(100, "fixed", 0)).toBe(0);
  });
});

describe("Tax Calculation", () => {
  it("should calculate 19% VAT correctly", () => {
    expect(calculateTax(100, 19)).toBe(19);
    expect(calculateTax(50, 19)).toBe(9.5);
  });

  it("should calculate 7% reduced VAT correctly", () => {
    expect(calculateTax(100, 7)).toBe(7);
  });

  it("should return 0 for 0% tax rate", () => {
    expect(calculateTax(100, 0)).toBe(0);
  });

  it("should round to 2 decimal places", () => {
    const tax = calculateTax(33.33, 19);
    expect(tax.toString().split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});
