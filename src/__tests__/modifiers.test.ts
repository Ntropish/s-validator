import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("Modifiers", () => {
  describe("optional", () => {
    it("should allow an optional property to be missing", async () => {
      const schema = s.object({
        properties: {
          required: s.string(),
          optional: s.string({ optional: true }),
        },
      });
      const data = { required: "hello" };
      await expect(schema.parse(data)).resolves.toEqual(data);
    });

    it("should still validate an optional property if it is present", async () => {
      const schema = s.object({
        properties: {
          optional: s.string({ minLength: 5, optional: true }),
        },
      });
      // This should pass
      const validData = { optional: "longenough" };
      await expect(schema.parse(validData)).resolves.toEqual(validData);

      // This should fail
      const invalidData = { optional: "shrt" };
      await expect(schema.parse(invalidData)).rejects.toThrow();
    });

    it.only("should fail if a required property is missing", async () => {
      const schema = s.object({
        properties: {
          required: s.string(),
        },
      });
      const data = {}; // Missing 'required' property
      await expect(schema.parse(data)).rejects.toThrow();
    });
  });

  describe("nullable", () => {
    it("should allow a nullable property to be null", async () => {
      const schema = s.string({ nullable: true });
      await expect(schema.parse(null)).resolves.toBeNull();
    });

    it("should fail a non-nullable property that is null", async () => {
      const schema = s.string();
      await expect(schema.parse(null)).rejects.toThrow();
    });

    it("should still validate a nullable property if it is not null", async () => {
      const schema = s.string({ minLength: 5, nullable: true });
      // This should pass
      await expect(schema.parse("longenough")).resolves.toBe("longenough");
      // This should fail
      await expect(schema.parse("shrt")).rejects.toThrow();
    });
  });

  describe("Chaining", () => {
    it("should allow a property that is optional and nullable to be undefined or null", async () => {
      const schema = s.string({ optional: true, nullable: true });
      await expect(schema.parse(undefined)).resolves.toBeUndefined();
      await expect(schema.parse(null)).resolves.toBeNull();
    });

    it("should correctly validate a chained property that has a value", async () => {
      const schema = s.string({ minLength: 5, optional: true, nullable: true });
      // This should pass
      await expect(schema.parse("longenough")).resolves.toBe("longenough");
      // This should fail
      await expect(schema.parse("shrt")).rejects.toThrow();
    });
  });
});
