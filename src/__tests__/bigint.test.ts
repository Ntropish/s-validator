import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../types.js";

describe("BigInt Validator", () => {
  it("should validate a bigint", async () => {
    const schema = s.bigint();
    await expect(schema.parse(10n)).resolves.toBe(10n);
    await expect(schema.parse("10" as any)).rejects.toThrow(ValidationError);
  });

  it("should coerce a value to a bigint", async () => {
    const schema = s.bigint({ prepare: { coerce: true } });
    await expect(schema.parse("123")).resolves.toBe(123n);
    await expect(schema.parse(456)).resolves.toBe(456n);
    await expect(schema.parse(true)).resolves.toBe(1n);
  });

  it("should handle gt/gte validators", async () => {
    const gtSchema = s.bigint({ validate: { gt: 10n } });
    await expect(gtSchema.parse(11n)).resolves.toBe(11n);
    await expect(gtSchema.parse(10n)).rejects.toThrow(ValidationError);

    const gteSchema = s.bigint({ validate: { gte: 10n } });
    await expect(gteSchema.parse(10n)).resolves.toBe(10n);
    await expect(gteSchema.parse(9n)).rejects.toThrow(ValidationError);
  });

  it("should handle lt/lte validators", async () => {
    const ltSchema = s.bigint({ validate: { lt: 10n } });
    await expect(ltSchema.parse(9n)).resolves.toBe(9n);
    await expect(ltSchema.parse(10n)).rejects.toThrow(ValidationError);

    const lteSchema = s.bigint({ validate: { lte: 10n } });
    await expect(lteSchema.parse(10n)).resolves.toBe(10n);
    await expect(lteSchema.parse(11n)).rejects.toThrow(ValidationError);
  });

  it("should handle positive/negative validators", async () => {
    const positiveSchema = s.bigint({ validate: { positive: true } });
    await expect(positiveSchema.parse(1n)).resolves.toBe(1n);
    await expect(positiveSchema.parse(0n)).rejects.toThrow(ValidationError);
    await expect(positiveSchema.parse(-1n)).rejects.toThrow(ValidationError);

    const negativeSchema = s.bigint({ validate: { negative: true } });
    await expect(negativeSchema.parse(-1n)).resolves.toBe(-1n);
    await expect(negativeSchema.parse(0n)).rejects.toThrow(ValidationError);
    await expect(negativeSchema.parse(1n)).rejects.toThrow(ValidationError);
  });

  it("should handle multipleOf validator", async () => {
    const schema = s.bigint({ validate: { multipleOf: 3n } });
    await expect(schema.parse(9n)).resolves.toBe(9n);
    await expect(schema.parse(10n)).rejects.toThrow(ValidationError);
  });
});
