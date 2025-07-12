import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../validators/types.js";

describe("Union Validator", () => {
  it("should pass if the value matches one of the schemas", async () => {
    const schema = s.union([s.string(), s.number()]);
    await expect(schema.parse("hello")).resolves.toBe("hello");
    await expect(schema.parse(123)).resolves.toBe(123);
  });

  it("should throw if the value does not match any of the schemas", async () => {
    const schema = s.union([s.string(), s.number()]);
    await expect(schema.parse(true as any)).rejects.toThrow(ValidationError);
  });

  it("should pass with more complex schemas", async () => {
    const stringSchema = s.string({ minLength: 5 });
    const numberSchema = s.number({ min: 100 });
    const schema = s.union([stringSchema, numberSchema]);

    await expect(schema.parse("long enough")).resolves.toBe("long enough");
    await expect(schema.parse(150)).resolves.toBe(150);
  });

  it("should throw with more complex schemas if validation fails", async () => {
    const stringSchema = s.string({ minLength: 6 });
    const numberSchema = s.number({ min: 100 });
    const schema = s.union([stringSchema, numberSchema]);

    const result = await schema.safeParse("short");
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error.issues).toHaveLength(2); // one for string, one for number
    }
  });

  it("should work with object schemas", async () => {
    const schemaA = s.object({
      properties: { type: s.string({ oneOf: ["a"] }), a: s.string() },
    });
    const schemaB = s.object({
      properties: { type: s.string({ oneOf: ["b"] }), b: s.number() },
    });
    const schema = s.union([schemaA, schemaB]);
    const dataA = { type: "a", a: "hello" };
    const dataB = { type: "b", b: 123 };
    const invalidData = { type: "a", a: 123 };

    await expect(schema.parse(dataA as any)).resolves.toEqual(dataA);
    await expect(schema.parse(dataB as any)).resolves.toEqual(dataB);
    await expect(schema.parse(invalidData as any)).rejects.toThrow(
      ValidationError
    );
  });
});
