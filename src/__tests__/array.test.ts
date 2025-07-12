import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../validators/types.js";

describe("Array Validators", () => {
  describe("length", () => {
    it("should pass when the array has the correct length", async () => {
      const schema = s.array({ validate: { ofType: s.any(), length: 3 } });
      await expect(schema.parse([1, 2, 3])).resolves.toEqual([1, 2, 3]);
    });

    it("should throw when the array does not have the correct length", async () => {
      const schema = s.array({ validate: { ofType: s.any(), length: 3 } });
      await expect(schema.parse([1, 2])).rejects.toThrow(ValidationError);
    });
  });

  describe("minLength", () => {
    it("should pass when the array meets the minimum length", async () => {
      const schema = s.array({ validate: { ofType: s.any(), minLength: 2 } });
      await expect(schema.parse([1, 2])).resolves.toEqual([1, 2]);
    });

    it("should throw when the array is shorter than the minimum length", async () => {
      const schema = s.array({ validate: { ofType: s.any(), minLength: 2 } });
      await expect(schema.parse([1])).rejects.toThrow(ValidationError);
    });
  });

  describe("maxLength", () => {
    it("should pass when the array is within the maximum length", async () => {
      const schema = s.array({ validate: { ofType: s.any(), maxLength: 2 } });
      await expect(schema.parse([1, 2])).resolves.toEqual([1, 2]);
    });

    it("should throw when the array exceeds the maximum length", async () => {
      const schema = s.array({ validate: { ofType: s.any(), maxLength: 2 } });
      await expect(schema.parse([1, 2, 3])).rejects.toThrow(ValidationError);
    });
  });

  describe("nonEmpty", () => {
    it("should pass for a non-empty array", async () => {
      const schema = s.array({ validate: { ofType: s.any(), nonEmpty: true } });
      await expect(schema.parse([1])).resolves.toEqual([1]);
    });

    it("should throw for an empty array", async () => {
      const schema = s.array({ validate: { ofType: s.any(), nonEmpty: true } });
      await expect(schema.parse([])).rejects.toThrow(ValidationError);
    });
  });

  describe("contains", () => {
    it("should pass when the array contains the specified element", async () => {
      const schema = s.array({ validate: { ofType: s.any(), contains: 2 } });
      await expect(schema.parse([1, 2, 3])).resolves.toEqual([1, 2, 3]);
    });

    it("should throw when the array does not contain the specified element", async () => {
      const schema = s.array({ validate: { ofType: s.any(), contains: 4 } });
      await expect(schema.parse([1, 2, 3])).rejects.toThrow(ValidationError);
    });
  });

  describe("excludes", () => {
    it("should pass when the array does not contain the specified element", async () => {
      const schema = s.array({ validate: { ofType: s.any(), excludes: 4 } });
      await expect(schema.parse([1, 2, 3])).resolves.toEqual([1, 2, 3]);
    });

    it("should throw when the array contains the specified element", async () => {
      const schema = s.array({ validate: { ofType: s.any(), excludes: 2 } });
      await expect(schema.parse([1, 2, 3])).rejects.toThrow(ValidationError);
    });
  });

  describe("unique", () => {
    it("should pass for an array with unique elements", async () => {
      const schema = s.array({ validate: { ofType: s.any(), unique: true } });
      await expect(schema.parse([1, 2, 3])).resolves.toEqual([1, 2, 3]);
    });

    it("should throw for an array with duplicate elements", async () => {
      const schema = s.array({ validate: { ofType: s.any(), unique: true } });
      await expect(schema.parse([1, 2, 2])).rejects.toThrow(ValidationError);
    });
  });

  describe("ofType", () => {
    it("should pass when all elements are of the correct type", async () => {
      const schema = s.array({ validate: { ofType: s.string() } });
      await expect(schema.parse(["a", "b"])).resolves.toEqual(["a", "b"]);
    });

    it("should throw when an element is of the wrong type", async () => {
      const schema = s.array({ validate: { ofType: s.string() } });
      await expect(schema.parse(["a", 1] as any)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("items", () => {
    it("should pass when all elements in the tuple match the schemas", async () => {
      const schema = s.array({
        validate: { ofType: s.any(), items: [s.string(), s.number()] },
      });
      await expect(schema.parse(["a", 1])).resolves.toEqual(["a", 1]);
    });

    it("should throw when an element in the tuple does not match the schema", async () => {
      const schema = s.array({
        validate: { ofType: s.any(), items: [s.string(), s.number()] },
      });
      await expect(schema.parse(["a", "b"] as any)).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw when the tuple has a different length than the schema array", async () => {
      const schema = s.array({
        validate: { ofType: s.any(), items: [s.string(), s.number()] },
      });
      await expect(schema.parse(["a", 1, 2] as any)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("Complex Nested Arrays", () => {
    it("should validate an array of user objects where each user has an array of tags", async () => {
      const userSchema = s.object({
        properties: {
          name: s.string(),
          tags: s.array({ validate: { ofType: s.string() } }),
        },
      });
      const schema = s.array({ validate: { ofType: userSchema } });
      const validData = [
        { name: "Alice", tags: ["dev", "js"] },
        { name: "Bob", tags: ["admin", "ts"] },
      ];
      await expect(schema.parse(validData)).resolves.toEqual(validData);
    });

    it("should validate a configuration tuple with a nested array of numbers", async () => {
      const schema = s.array({
        validate: {
          ofType: s.any(),
          items: [s.string(), s.array({ validate: { ofType: s.number() } })],
        },
      });
      const validData = ["config", [1, 2, 3]];
      await expect(schema.parse(validData)).resolves.toEqual(validData);
    });

    it("should validate a matrix (2D array) where each row has the same length", async () => {
      const rowSchema = s.array({
        validate: { ofType: s.number(), length: 3 },
      });
      const schema = s.array({ validate: { ofType: rowSchema } });
      const validData = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      await expect(schema.parse(validData)).resolves.toEqual(validData);
    });

    it("should validate a list of products with nested feature arrays", async () => {
      const featureSchema = s.object({
        properties: {
          id: s.string(),
          value: s.string(),
        },
      });
      const productSchema = s.object({
        properties: {
          name: s.string(),
          features: s.array({ validate: { ofType: featureSchema } }),
        },
      });
      const schema = s.array({ validate: { ofType: productSchema } });
      const validData = [
        {
          name: "Laptop",
          features: [
            { id: "cpu", value: "i7" },
            { id: "ram", value: "16GB" },
          ],
        },
      ];
      await expect(schema.parse(validData)).resolves.toEqual(validData);
    });

    it("should validate a deeply nested array (3D)", async () => {
      const schema = s.array({
        validate: {
          ofType: s.array({
            validate: {
              ofType: s.array({ validate: { ofType: s.number() } }),
            },
          }),
        },
      });
      const validData = [
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ];
      await expect(schema.parse(validData)).resolves.toEqual(validData);
    });
  });
});
