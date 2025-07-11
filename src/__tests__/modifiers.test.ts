import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("Modifiers", () => {
  describe("optional", () => {
    it("should allow an optional property to be missing", () => {
      const schema = s.object({
        properties: {
          required: s.string(),
          optional: s.string({ optional: true }),
        },
      });
      const data = { required: "hello" };
      expect(() => schema.parse(data)).not.toThrow();
    });

    it("should still validate an optional property if it is present", () => {
      const schema = s.object({
        properties: {
          optional: s.string({ minLength: 5, optional: true }),
        },
      });
      // This should pass
      const validData = { optional: "longenough" };
      expect(() => schema.parse(validData)).not.toThrow();

      // This should fail
      const invalidData = { optional: "shrt" };
      expect(() => schema.parse(invalidData)).toThrow();
    });

    it("should fail if a required property is missing", () => {
      const schema = s.object({
        properties: {
          required: s.string(),
        },
      });
      const data = {}; // Missing 'required' property
      expect(() => schema.parse(data)).toThrow();
    });
  });

  describe("nullable", () => {
    it("should allow a nullable property to be null", () => {
      const schema = s.string({ nullable: true });
      expect(() => schema.parse(null)).not.toThrow();
    });

    it("should fail a non-nullable property that is null", () => {
      const schema = s.string();
      expect(() => schema.parse(null)).toThrow();
    });

    it("should still validate a nullable property if it is not null", () => {
      const schema = s.string({ minLength: 5, nullable: true });
      // This should pass
      expect(() => schema.parse("longenough")).not.toThrow();
      // This should fail
      expect(() => schema.parse("shrt")).toThrow();
    });
  });

  describe("Chaining", () => {
    it("should allow a property that is optional and nullable to be undefined or null", () => {
      const schema = s.string({ optional: true, nullable: true });
      expect(() => schema.parse(undefined)).not.toThrow();
      expect(() => schema.parse(null)).not.toThrow();
    });

    it("should correctly validate a chained property that has a value", () => {
      const schema = s.string({ minLength: 5, optional: true, nullable: true });
      // This should pass
      expect(() => schema.parse("longenough")).not.toThrow();
      // This should fail
      expect(() => schema.parse("shrt")).toThrow();
    });
  });
});
