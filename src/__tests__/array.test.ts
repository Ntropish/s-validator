import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../validators/types.js";

describe("Array Validators", () => {
  describe("length", () => {
    it("should pass when the array has the correct length", async () => {
      const schema = s.array({ ofType: s.string(), length: 3 });
      await expect(schema.parse(["a", "b", "c"])).resolves.toEqual([
        "a",
        "b",
        "c",
      ]);
    });

    it("should throw when the array does not have the correct length", async () => {
      const schema = s.array({ ofType: s.string(), length: 3 });
      await expect(schema.parse(["a", "b"])).rejects.toThrow(ValidationError);
    });
  });

  describe("minLength", () => {
    it("should pass when the array meets the minimum length", async () => {
      const schema = s.array({ ofType: s.number(), minLength: 2 });
      await expect(schema.parse([1, 2, 3])).resolves.toEqual([1, 2, 3]);
    });

    it("should throw when the array is shorter than the minimum length", async () => {
      const schema = s.array({ ofType: s.number(), minLength: 2 });
      await expect(schema.parse([1])).rejects.toThrow(ValidationError);
    });
  });

  describe("maxLength", () => {
    it("should pass when the array is within the maximum length", async () => {
      const schema = s.array({ ofType: s.boolean(), maxLength: 2 });
      await expect(schema.parse([true, false])).resolves.toEqual([true, false]);
    });

    it("should throw when the array exceeds the maximum length", async () => {
      const schema = s.array({ ofType: s.boolean(), maxLength: 2 });
      await expect(schema.parse([true, false, true])).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("nonEmpty", () => {
    it("should pass for a non-empty array", async () => {
      const schema = s.array({ ofType: s.string(), nonEmpty: true });
      await expect(schema.parse(["a"])).resolves.toEqual(["a"]);
    });

    it("should throw for an empty array", async () => {
      const schema = s.array({ ofType: s.string(), nonEmpty: true });
      await expect(schema.parse([])).rejects.toThrow(ValidationError);
    });
  });

  describe("contains", () => {
    it("should pass when the array contains the specified element", async () => {
      const schema = s.array({ ofType: s.number(), contains: 5 });
      await expect(schema.parse([1, 3, 5])).resolves.toEqual([1, 3, 5]);
    });

    it("should throw when the array does not contain the specified element", async () => {
      const schema = s.array({ ofType: s.number(), contains: 5 });
      await expect(schema.parse([1, 3, 4])).rejects.toThrow(ValidationError);
    });
  });

  describe("excludes", () => {
    it("should pass when the array does not contain the specified element", async () => {
      const schema = s.array({ ofType: s.string(), excludes: "b" });
      await expect(schema.parse(["a", "c"])).resolves.toEqual(["a", "c"]);
    });

    it("should throw when the array contains the specified element", async () => {
      const schema = s.array({ ofType: s.string(), excludes: "b" });
      await expect(schema.parse(["a", "b", "c"])).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("unique", () => {
    it("should pass for an array with unique elements", async () => {
      const schema = s.array({ ofType: s.number(), unique: true });
      await expect(schema.parse([1, 2, 3])).resolves.toEqual([1, 2, 3]);
    });

    it("should throw for an array with duplicate elements", async () => {
      const schema = s.array({ ofType: s.number(), unique: true });
      await expect(schema.parse([1, 2, 2])).rejects.toThrow(ValidationError);
    });
  });

  describe("ofType", () => {
    it("should pass when all elements are of the correct type", async () => {
      const schema = s.array({ ofType: s.string() });
      await expect(schema.parse(["a", "b"])).resolves.toEqual(["a", "b"]);
    });

    it("should throw when an element is of the wrong type", async () => {
      const schema = s.array({ ofType: s.string() });
      await expect(schema.parse(["a", 1])).rejects.toThrow(ValidationError);
    });
  });

  describe("items", () => {
    it("should pass when all elements in the tuple match the schemas", async () => {
      const schema = s.array({
        items: [s.string(), s.number(), s.boolean()],
      });
      await expect(schema.parse(["a", 1, true])).resolves.toEqual([
        "a",
        1,
        true,
      ]);
    });

    it("should throw when an element in the tuple does not match the schema", async () => {
      const schema = s.array({
        items: [s.string(), s.number(), s.boolean()],
      });
      await expect(schema.parse(["a", "b", true])).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw when the tuple has a different length than the schema array", async () => {
      const schema = s.array({ items: [s.string(), s.number()] });
      await expect(schema.parse(["a", 1, true])).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("Complex Nested Arrays", () => {
    it("should validate an array of user objects where each user has an array of tags", async () => {
      const userSchema = s.object({
        properties: {
          name: s.string(),
          tags: s.array({ ofType: s.string(), minLength: 1 }),
        },
      });
      const schema = s.array({ ofType: userSchema });
      const data = [
        { name: "Alice", tags: ["admin", "editor"] },
        { name: "Bob", tags: ["viewer"] },
      ];
      await expect(schema.parse(data)).resolves.toEqual(data);
    });

    it("should validate a configuration tuple with a nested array of numbers", async () => {
      const schema = s.array({
        items: [s.string(), s.array({ ofType: s.number() })],
      });
      const data = ["config", [1, 2, 3]];
      await expect(schema.parse(data)).resolves.toEqual(data);
    });

    it("should validate a matrix (2D array) where each row has the same length", async () => {
      const rowSchema = s.array({ ofType: s.number(), length: 3 });
      const schema = s.array({ ofType: rowSchema });
      const data = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      await expect(schema.parse(data)).resolves.toEqual(data);
    });

    it("should validate a list of products with nested feature arrays", async () => {
      const productSchema = s.object({
        properties: {
          name: s.string(),
          features: s.array({ ofType: s.string() }),
        },
      });
      const schema = s.array({ ofType: productSchema });
      const data = [
        { name: "Laptop", features: ["fast", "light"] },
        { name: "Mouse", features: [] },
      ];
      await expect(schema.parse(data)).resolves.toEqual(data);
    });

    it("should validate a deeply nested array (3D)", async () => {
      const schema = s.array({
        ofType: s.array({ ofType: s.array({ ofType: s.number() }) }),
      });
      const data = [
        [
          [1, 2],
          [3, 4],
        ],
        [[5, 6]],
      ];
      await expect(schema.parse(data)).resolves.toEqual(data);
    });
  });
});
