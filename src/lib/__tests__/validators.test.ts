import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validators";

describe("registerSchema", () => {
  it("accepts valid email and password", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "Test1234",
    });
    expect(result.success).toBe(true);
  });

  it("normalizes email to lowercase", () => {
    const result = registerSchema.safeParse({
      email: "USER@EXAMPLE.COM",
      password: "Test1234",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "Test1234",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "Te1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase letter", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "test1234",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "Testtest",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password longer than 32 characters", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "A1" + "a".repeat(31),
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid email and any non-empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "x",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});