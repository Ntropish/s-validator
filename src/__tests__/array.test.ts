import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("Array Validators", () => {
  describe("length", () => {
    it("should pass when the array has the correct length", () => {
      s.array({ length: 3 }).parse([1, 2, 3]);
    });

    it("should throw when the array does not have the correct length", () => {
      expect(() => s.array({ length: 3 }).parse([1, 2])).toThrow();
    });
  });

  describe("minLength", () => {
    it("should pass when the array meets the minimum length", () => {
      s.array({ minLength: 2 }).parse([1, 2, 3]);
    });

    it("should throw when the array is shorter than the minimum length", () => {
      expect(() => s.array({ minLength: 3 }).parse([1, 2])).toThrow();
    });
  });

  describe("maxLength", () => {
    it("should pass when the array is within the maximum length", () => {
      s.array({ maxLength: 3 }).parse([1, 2, 3]);
    });

    it("should throw when the array exceeds the maximum length", () => {
      expect(() => s.array({ maxLength: 2 }).parse([1, 2, 3])).toThrow();
    });
  });

  describe("nonEmpty", () => {
    it("should pass for a non-empty array", () => {
      s.array({ nonEmpty: true }).parse([1]);
    });

    it("should throw for an empty array", () => {
      expect(() => s.array({ nonEmpty: true }).parse([])).toThrow();
    });
  });

  describe("contains", () => {
    it("should pass when the array contains the specified element", () => {
      s.array({ contains: 5 }).parse([1, 3, 5]);
    });

    it("should throw when the array does not contain the specified element", () => {
      expect(() => s.array({ contains: 4 }).parse([1, 3, 5])).toThrow();
    });
  });

  describe("excludes", () => {
    it("should pass when the array does not contain the specified element", () => {
      s.array({ excludes: 4 }).parse([1, 3, 5]);
    });

    it("should throw when the array contains the specified element", () => {
      expect(() => s.array({ excludes: 5 }).parse([1, 3, 5])).toThrow();
    });
  });

  describe("unique", () => {
    it("should pass for an array with unique elements", () => {
      s.array({ unique: true }).parse([1, 2, 3]);
    });

    it("should throw for an array with duplicate elements", () => {
      expect(() => s.array({ unique: true }).parse([1, 2, 2])).toThrow();
    });
  });

  describe("ofType", () => {
    it("should pass when all elements are of the correct type", () => {
      s.array({ ofType: s.string() }).parse(["a", "b", "c"]);
    });

    it("should throw when an element is of the wrong type", () => {
      expect(() =>
        s.array({ ofType: s.string() }).parse(["a", 2, "c"])
      ).toThrow();
    });
  });

  describe("items", () => {
    it("should pass when all elements in the tuple match the schemas", () => {
      s.array({ items: [s.string(), s.number()] }).parse(["a", 1]);
    });

    it("should throw when an element in the tuple does not match the schema", () => {
      expect(() =>
        s.array({ items: [s.string(), s.number()] }).parse(["a", "b"])
      ).toThrow();
    });

    it("should throw when the tuple has a different length than the schema array", () => {
      expect(() =>
        s.array({ items: [s.string(), s.number()] }).parse(["a"])
      ).toThrow();
    });
  });

  describe("Complex Nested Arrays", () => {
    it("should validate an array of user objects where each user has an array of tags", () => {
      const userSchema = s.object({
        properties: {
          name: s.string({ minLength: 1 }),
          tags: s.array({ ofType: s.string({ minLength: 1 }) }),
        },
      });

      const validUsers = [
        { name: "Alice", tags: ["admin", "dev"] },
        { name: "Bob", tags: ["user"] },
      ];
      s.array({ ofType: userSchema }).parse(validUsers);

      const invalidUsers = [
        { name: "Alice", tags: ["admin", "dev"] },
        { name: "Bob", tags: [""] }, // Invalid empty tag
      ];
      expect(() =>
        s.array({ ofType: userSchema }).parse(invalidUsers)
      ).toThrow();
    });

    it("should validate a configuration tuple with a nested array of numbers", () => {
      const configSchema = s.array({
        items: [s.string(), s.array({ ofType: s.number() })],
      });

      const validConfig = ["SettingA", [1, 2, 3]];
      configSchema.parse(validConfig);

      const invalidConfig = ["SettingB", [1, "2", 3]]; // Invalid element in nested array
      expect(() => configSchema.parse(invalidConfig)).toThrow();
    });

    it("should validate a matrix (2D array) where each row has the same length", () => {
      const matrixSchema = s.array({
        ofType: s.array({ length: 3, ofType: s.number() }),
      });

      const validMatrix = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];
      matrixSchema.parse(validMatrix);

      const invalidMatrix = [
        [1, 2, 3],
        [4, 5], // Invalid length
        [7, 8, 9],
      ];
      expect(() => matrixSchema.parse(invalidMatrix)).toThrow();
    });

    it("should validate a list of products with nested feature arrays", () => {
      const productSchema = s.object({
        properties: {
          name: s.string({ minLength: 1 }),
          price: s.number({ min: 0 }),
          features: s.array({
            ofType: s.string({ minLength: 1 }),
            minLength: 1,
          }),
        },
      });
      const productsSchema = s.array({ ofType: productSchema, minLength: 1 });

      const validProducts = [
        { name: "Laptop", price: 1200, features: ["8GB RAM", "512GB SSD"] },
        { name: "Mouse", price: 25, features: ["Wireless", "Ergonomic"] },
      ];
      productsSchema.parse(validProducts);

      const invalidProducts = [
        { name: "Keyboard", price: 75, features: [] }, // Empty features array
      ];
      expect(() => productsSchema.parse(invalidProducts)).toThrow();
    });

    it("should validate a deeply nested array (3D)", () => {
      const deepArraySchema = s.array({
        ofType: s.array({
          ofType: s.array({ ofType: s.number() }),
        }),
      });

      const validDeepArray = [[[1], [2, 3]], [[4, 5, 6]]];
      deepArraySchema.parse(validDeepArray);

      const invalidDeepArray = [
        [[1], [2, "3"]], // Invalid type
        [[4, 5, 6]],
      ];
      expect(() => deepArraySchema.parse(invalidDeepArray)).toThrow();
    });
  });
});
