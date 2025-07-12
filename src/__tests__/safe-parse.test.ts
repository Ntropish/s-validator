import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../validators/types.js";

describe("safeParse", () => {
  it("should return a success result for valid data", async () => {
    const schema = s.string({ minLength: 3 });
    const result = await schema.safeParse("hello");
    if (result.status === "success") {
      expect(result.data).toBe("hello");
    } else {
      expect.fail("Parsing should have succeeded");
    }
  });

  it("should return a failure result for invalid data", async () => {
    const schema = s.string({ minLength: 5 });
    const result = await schema.safeParse("hi");

    if (result.status === "error") {
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.issues).toHaveLength(1);
      expect(result.error.issues[0].message).toContain("minLength");
    } else {
      expect.fail("Parsing should have failed");
    }
  });

  it("should collect multiple errors", async () => {
    const schema = s.string({ minLength: 10, pattern: /^[a-zA-Z]+$/ });
    const result = await schema.safeParse("123");
    if (result.status === "error") {
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.issues).toHaveLength(2);
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("minLength"))).toBe(true);
      expect(messages.some((m) => m.includes("pattern"))).toBe(true);
    } else {
      expect.fail("Parsing should have failed");
    }
  });

  it("should handle identity errors correctly", async () => {
    const schema = s.number();
    const result = await schema.safeParse("not a number" as any);
    if (result.status === "error") {
      expect(result.error.issues[0].message).toContain(
        "Invalid type. Expected number, received string"
      );
    } else {
      expect.fail("Parsing should have failed");
    }
  });

  it("should still throw from .parse()", async () => {
    const schema = s.string({ minLength: 5 });
    await expect(schema.parse("hi")).rejects.toThrow(ValidationError);
  });
});
