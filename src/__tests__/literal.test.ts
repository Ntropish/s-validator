import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../validators/types.js";

describe("Literal Validator", () => {
  it("should pass for a correct string literal", async () => {
    const schema = s.literal({ validate: { identity: "hello" } });
    await expect(schema.parse("hello")).resolves.toBe("hello");
  });

  it("should throw for an incorrect string literal", async () => {
    const schema = s.literal({ validate: { identity: "hello" } });
    await expect(schema.parse("world" as any)).rejects.toThrow(ValidationError);
  });

  it("should pass for a correct number literal", async () => {
    const schema = s.literal({ validate: { identity: 123 } });
    await expect(schema.parse(123)).resolves.toBe(123);
  });

  it("should throw for an incorrect number literal", async () => {
    const schema = s.literal({ validate: { identity: 123 } });
    await expect((schema as any).parse(456)).rejects.toThrow(ValidationError);
  });

  it("should pass for a correct boolean literal", async () => {
    const schema = s.literal({ validate: { identity: true } });
    await expect(schema.parse(true)).resolves.toBe(true);
  });

  it("should throw for an incorrect boolean literal", async () => {
    const schema = s.literal({ validate: { identity: true } });
    await expect((schema as any).parse(false)).rejects.toThrow(ValidationError);
  });

  it("should pass for null literal", async () => {
    const schema = s.literal({ validate: { identity: null } });
    await expect(schema.parse(null)).resolves.toBe(null);
  });

  it("should throw for non-null value for null literal", async () => {
    const schema = s.literal({ validate: { identity: null } });
    await expect((schema as any).parse(undefined)).rejects.toThrow(
      ValidationError
    );
    await expect((schema as any).parse(0)).rejects.toThrow(ValidationError);
  });

  it("should be usable in object schemas", async () => {
    const schema = s.object({
      properties: {
        type: s.literal({ validate: { identity: "user" } }),
        name: s.string(),
      },
    });
    const data = { type: "user" as const, name: "John" };
    await expect(schema.parse(data)).resolves.toEqual(data);
  });

  it("should throw in object schemas for incorrect literal", async () => {
    const schema = s.object({
      properties: {
        type: s.literal({ validate: { identity: "user" } }),
        name: s.string(),
      },
    });
    const data = { type: "admin" as const, name: "John" };
    await expect(schema.parse(data as any)).rejects.toThrow(ValidationError);
  });
});
