import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../validators/types.js";

describe("safeParse", () => {
  it("should return a success result for valid data", async () => {
    const schema = s.string({ validate: { minLength: 3 } });
    const result = await schema.safeParse("hello");
    if (result.status === "success") {
      expect(result.data).toBe("hello");
    } else {
      expect.fail("Parsing should have succeeded");
    }
  });

  it("should return a failure result for invalid data", async () => {
    const schema = s.string({ validate: { minLength: 5 } });
    const result = await schema.safeParse("shrt");
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error.issues[0].message).toBe(
        "String must be at least 5 characters long."
      );
    }
  });

  it("should collect multiple errors", async () => {
    const schema = s.object({
      properties: {
        name: s.string({ validate: { minLength: 4 }, label: "Full Name" }),
        age: s.number({ validate: { min: 18 }, label: "User Age" }),
      },
    });

    const result = await schema.safeParse({ name: "a", age: 17 });
    expect(result.status).toBe("error");

    if (result.status === "error") {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toHaveLength(2);
      expect(messages).toContain(
        "Full Name must be at least 4 characters long."
      );
      expect(messages).toContain("User Age must be at least 18.");
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
    const schema = s.string({ validate: { minLength: 5 } });
    await expect(schema.parse("hi")).rejects.toThrow(ValidationError);
  });
});
