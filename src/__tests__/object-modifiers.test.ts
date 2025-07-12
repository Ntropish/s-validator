import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("Object Modifiers", () => {
  describe("partial", () => {
    const baseSchema = s.object({
      properties: {
        name: s.string(),
        age: s.number(),
      },
    });

    it("should make all properties optional", async () => {
      const partialSchema = baseSchema.partial();

      // All properties are optional, so an empty object is valid
      await expect(partialSchema.parse({})).resolves.toEqual({});

      // A single property is valid
      await expect(partialSchema.parse({ name: "John" })).resolves.toEqual({
        name: "John",
      });

      // All properties are valid
      await expect(
        partialSchema.parse({ name: "John", age: 30 })
      ).resolves.toEqual({ name: "John", age: 30 });
    });

    it("should not affect the original schema", async () => {
      // Create the partial schema but don't use it
      baseSchema.partial();

      // The base schema should still require all properties
      await expect(baseSchema.parse({})).rejects.toThrow();
      await expect(
        (baseSchema as any).parse({ name: "John" })
      ).rejects.toThrow();
    });

    it("should still enforce types for provided properties", async () => {
      const partialSchema = baseSchema.partial();

      await expect(
        (partialSchema as any).parse({ name: 123 })
      ).rejects.toThrow();
    });

    it("should work on non-object schemas without throwing", async () => {
      const schema = s.string();
      const partialSchema = (schema as any).partial();
      await expect(partialSchema.parse("hello")).resolves.toBe("hello");
    });
  });

  describe("pick", () => {
    const baseSchema = s.object({
      properties: {
        name: s.string(),
        age: s.number(),
        email: s.string({ email: true }),
      },
    });

    it("should create a new schema with only the selected properties", async () => {
      const pickedSchema = (baseSchema as any).pick(["name", "age"]);
      const validInput = { name: "John", age: 30 };
      const invalidInput = { name: "John", age: 30, email: "john@example.com" };

      await expect(pickedSchema.parse(validInput)).resolves.toEqual(validInput);

      // The picked schema should not allow properties that were not picked
      await expect((pickedSchema as any).parse(invalidInput)).rejects.toThrow();
    });

    it("should not affect the original schema", async () => {
      (baseSchema as any).pick(["name"]);
      await expect(
        baseSchema.parse({ name: "John", age: 30, email: "a@a.com" })
      ).resolves.toBeTruthy();
      await expect(
        (baseSchema as any).parse({ name: "John" })
      ).rejects.toThrow();
    });

    it("should still enforce types for picked properties", async () => {
      const pickedSchema = (baseSchema as any).pick(["name"]);
      await expect(
        (pickedSchema as any).parse({ name: 123 })
      ).rejects.toThrow();
    });

    it("should work on non-object schemas without throwing", async () => {
      const schema = s.string();
      const pickedSchema = (schema as any).pick(["name"]);
      await expect(pickedSchema.parse("hello")).resolves.toBe("hello");
    });

    it("should handle picking non-existent keys gracefully", async () => {
      const pickedSchema = (baseSchema as any).pick(["nonexistent"]);
      // An empty object should be valid
      await expect(pickedSchema.parse({})).resolves.toEqual({});
      // Any other property should be rejected
      await expect(
        (pickedSchema as any).parse({ name: "test" })
      ).rejects.toThrow();
    });
  });
});
