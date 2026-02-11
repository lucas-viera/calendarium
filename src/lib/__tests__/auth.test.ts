import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "@/lib/auth";

describe("password utilities", () => {
  it("hashes a password and verifies it correctly", async () => {
    const password = "Test1234";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]?\$/);

    const isValid = await comparePassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("Test1234");
    const isValid = await comparePassword("WrongPass1", hash);
    expect(isValid).toBe(false);
  });

  it("generates different hashes for same password (salt)", async () => {
    const hash1 = await hashPassword("Test1234");
    const hash2 = await hashPassword("Test1234");
    expect(hash1).not.toBe(hash2);
  });
});