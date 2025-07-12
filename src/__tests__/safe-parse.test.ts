import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../validators/types.js";

describe("safeParse", () => {
  it("should return a success result for valid data", () => {
    const schema = s.string({ minLength: 3 });
    const result = schema.safeParse("hello");
    if (result.success) {
      expect(result.data).toBe("hello");
    } else {
      expect.fail("Parsing should have succeeded");
    }
  });

  it("should return a failure result for invalid data", () => {
    const schema = s.string({ minLength: 5 });
    const result = schema.safeParse("hi");

    if (result.success === false) {
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.issues).toHaveLength(1);
      expect(result.error.issues[0].message).toContain("minLength");
    } else {
      expect.fail("Parsing should have failed");
    }
  });

  it("should collect multiple errors", () => {
    const schema = s.string({ minLength: 10, pattern: /^[a-zA-Z]+$/ });
    const result = schema.safeParse("123");
    if (result.success === true) {
      expect.fail("Parsing should have failed");
    } else {
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.issues).toHaveLength(2);
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("minLength"))).toBe(true);
      expect(messages.some((m) => m.includes("pattern"))).toBe(true);
    }
  });

  it("should handle identity errors correctly", () => {
    const schema = s.number();
    const result = schema.safeParse("not a number" as any);
    if (result.success === true) {
      expect.fail("Parsing should have failed");
    } else {
      expect(result.error.issues[0].message).toContain(
        "Invalid type. Expected number, received string"
      );
    }
  });

  it("should still throw from .parse()", () => {
    const schema = s.string({ minLength: 5 });
    expect(() => schema.parse("hi")).toThrow(ValidationError);
  });
});
