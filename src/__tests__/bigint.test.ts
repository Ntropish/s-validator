import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../types.js";

describe("BigInt Validator", () => {
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

  describe("coerce", () => {
    it("should coerce a string to a bigint", async () => {
      const schema = s.bigint({ prepare: { coerce: true } });
      await expect(schema.parse("123" as any)).resolves.toBe(BigInt(123));
    });

    it("should coerce a number to a bigint", async () => {
      const schema = s.bigint({ prepare: { coerce: true } });
      await expect(schema.parse(123 as any)).resolves.toBe(BigInt(123));
    });

    it("should not coerce an invalid string", async () => {
      const schema = s.bigint({ prepare: { coerce: true } });
      await expect(schema.parse("123a" as any)).rejects.toThrow(
        ValidationError
      );
    });

    it("should not coerce when disabled", async () => {
      const schema = s.bigint({ prepare: { coerce: false } });
      await expect(schema.parse("123" as any)).rejects.toThrow(ValidationError);
    });
  });
});
