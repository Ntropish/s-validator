import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../validators/types.js";

describe("Object Modifiers", () => {
  const baseSchema = s.object({
    validate: {
      properties: {
        name: s.string({ validate: { minLength: 1 } }),
        age: s.number(),
      },
    },
  });

  describe("partial", () => {
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
      await expect(baseSchema.parse({ name: "John" })).rejects.toThrow();
    });

    it("should still enforce types for provided properties", async () => {
      const partialSchema = baseSchema.partial();

      await expect(partialSchema.parse({ name: 123 })).rejects.toThrow();
    });
  });

  describe("pick", () => {
    const baseSchema = s.object({
      validate: {
        properties: {
          name: s.string(),
          age: s.number(),
          email: s.string({ validate: { email: true } }),
        },
      },
    });

    it("should create a new schema with only the selected properties", async () => {
      const pickedSchema = baseSchema.pick(["name", "age"]);
      const validInput = { name: "John", age: 30 };
      const invalidInput = { name: "John", age: 30, email: "john@example.com" };

      await expect(pickedSchema.parse(validInput)).resolves.toEqual(validInput);

      await expect(pickedSchema.parse(invalidInput)).rejects.toThrow();
    });

    it("should not affect the original schema", async () => {
      baseSchema.pick(["name"]);
      await expect(
        baseSchema.parse({ name: "John", age: 30, email: "a@a.com" })
      ).resolves.toBeTruthy();
      await expect(baseSchema.parse({ name: "John" })).rejects.toThrow();
    });

    it("should still enforce types for picked properties", async () => {
      const pickedSchema = baseSchema.pick(["name"]);
      await expect(pickedSchema.parse({ name: 123 })).rejects.toThrow();
    });

    it("should handle picking non-existent keys gracefully", async () => {
      // @ts-expect-error - Testing picking a key that does not exist.
      const pickedSchema = baseSchema.pick(["nonexistent"]);
      // An empty object should be valid
      await expect(pickedSchema.parse({})).resolves.toEqual({});
      // Any other property should be rejected
      await expect(pickedSchema.parse({ name: "test" })).rejects.toThrow();
    });
  });
  describe("omit", () => {
    const baseSchema = s.object({
      validate: {
        properties: {
          name: s.string(),
          age: s.number(),
          email: s.string({ validate: { email: true } }),
        },
      },
    });

    it("should create a new schema with the specified properties removed", async () => {
      const omittedSchema = baseSchema.omit(["email"]);
      const validInput = { name: "John", age: 30 };

      await expect(omittedSchema.parse(validInput)).resolves.toEqual(
        validInput
      );

      const invalidInput = { name: "John", age: 30, email: "a@a.com" };
      await expect(omittedSchema.parse(invalidInput)).rejects.toThrow();
    });

    it("should not affect the original schema", async () => {
      baseSchema.omit(["email"]);
      await expect(
        baseSchema.parse({ name: "John", age: 30, email: "a@a.com" })
      ).resolves.toBeTruthy();
    });

    it("should still enforce types for remaining properties", async () => {
      const omittedSchema = baseSchema.omit(["email"]);
      await expect(
        omittedSchema.parse({ name: "John", age: "30" })
      ).rejects.toThrow();
    });

    it("should handle omitting non-existent keys gracefully", async () => {
      // @ts-expect-error - Testing omitting a key that does not exist.
      const omittedSchema = baseSchema.omit(["nonexistent"]);
      const validInput = { name: "John", age: 30, email: "a@a.com" };
      await expect(omittedSchema.parse(validInput)).resolves.toEqual(
        validInput
      );
    });
  });

  describe("extend", () => {
    const baseSchema = s.object({
      validate: {
        properties: {
          name: s.string(),
        },
      },
    });

    it("should add new properties to the schema", async () => {
      const extendedSchema = baseSchema.extend({
        age: s.number(),
      });
      const data = { name: "John", age: 30 };
      await expect(extendedSchema.parse(data)).resolves.toEqual(data);
    });

    it("should overwrite existing properties", async () => {
      const extendedSchema = baseSchema.extend({
        name: s.number(), // Overwriting string with number
      });
      const data = { name: 123 };
      await expect(extendedSchema.parse(data)).resolves.toEqual(data);
    });

    it("should not affect the original schema", async () => {
      const newSchema = baseSchema.extend({ age: s.number() });
      // original schema should still pass with just a name
      await expect(newSchema.parse({ name: "test" })).resolves.toEqual({
        name: "test",
      });
      // original schema should ignore extra properties because it is not strict
      await expect(newSchema.parse({ name: "John", age: 30 })).resolves.toEqual(
        { name: "John", age: 30 }
      );
    });

    it("should correctly validate the extended schema", async () => {
      const extendedSchema = baseSchema.extend({
        age: s.number(),
      });
      // Missing 'age'
      await expect(extendedSchema.parse({ name: "John" })).rejects.toThrow();
      // Incorrect type for 'age'
      await expect(
        extendedSchema.parse({ name: "John", age: "30" })
      ).rejects.toThrow();
    });
  });
});
