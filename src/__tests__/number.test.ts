import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../validators/types.js";

describe("Number Addon Validators", () => {
  describe("shorthands", () => {
    it("should handle gt", async () => {
      const schema = s.number({ gt: 5 });
      await expect(schema.parse(6)).resolves.toBe(6);
      await expect(schema.parse(5)).rejects.toThrow();
    });

    it("should handle gte", async () => {
      const schema = s.number({ gte: 5 });
      await expect(schema.parse(5)).resolves.toBe(5);
      await expect(schema.parse(4)).rejects.toThrow();
    });

    it("should handle lt", async () => {
      const schema = s.number({ lt: 5 });
      await expect(schema.parse(4)).resolves.toBe(4);
      await expect(schema.parse(5)).rejects.toThrow();
    });

    it("should handle lte", async () => {
      const schema = s.number({ lte: 5 });
      await expect(schema.parse(5)).resolves.toBe(5);
      await expect(schema.parse(6)).rejects.toThrow();
    });
  });

  describe("bigint", () => {
    it("should validate a correct bigint", async () => {
      const schema = s.bigint();
      await expect(schema.parse(BigInt(9007199254740991))).resolves.toBe(
        BigInt(9007199254740991)
      );
    });

    it("should throw for a non-bigint", async () => {
      const schema = s.bigint();
      await expect((schema as any).parse(123)).rejects.toThrow(ValidationError);
    });
  });

  describe("nan", () => {
    it("should validate NaN", async () => {
      const schema = s.nan();
      await expect(schema.parse(NaN)).resolves.toBeNaN();
    });

    it("should throw for a non-NaN value", async () => {
      const schema = s.nan();
      await expect((schema as any).parse(123)).rejects.toThrow(ValidationError);
    });
  });
});
