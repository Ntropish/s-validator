import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../validators/types.js";

describe("Validation", () => {
  it("should validate a string", async () => {
    const schema = s.string({
      validate: { minLength: 3, maxLength: 10 },
    });
    await expect(schema.parse("hello")).resolves.toBe("hello");
    await expect(schema.parse("hi")).rejects.toThrow(ValidationError);
    await expect(schema.parse("this is too long")).rejects.toThrow(
      ValidationError
    );
  });

  it("should validate an object", async () => {
    const schema = s.object({
      properties: {
        name: s.string({ validate: { minLength: 2 } }),
        age: s.number({ validate: { min: 18 } }),
      },
    });
    await expect(schema.parse({ name: "John Doe", age: 30 })).resolves.toEqual({
      name: "John Doe",
      age: 30,
    });
    await expect(schema.parse({ name: "J", age: 30 })).rejects.toThrow(
      ValidationError
    );
  });

  it("should use custom error messages when provided", async () => {
    const schema = s.string({
      minLength: 5,
      messages: {
        minLength: "String must be at least 5 characters long",
      },
    });
    await expect(schema.parse("hi")).rejects.toThrow(
      "String must be at least 5 characters long"
    );
  });
});
