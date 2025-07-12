import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../validators/types.js";

describe("Boolean Validator", () => {
  it("should validate a boolean", async () => {
    const schema = s.boolean();
    await expect(schema.parse(true)).resolves.toBe(true);
    await expect(schema.parse(false)).resolves.toBe(false);
  });

  it("should throw for a non-boolean", async () => {
    const schema = s.boolean();
    await expect(schema.parse("true" as any)).rejects.toThrow(ValidationError);
  });

  describe("coerce", () => {
    it("should coerce a truthy value to true", async () => {
      const schema = s.boolean({ preparations: { coerce: true } });
      await expect(schema.parse("hello" as any)).resolves.toBe(true);
      await expect(schema.parse(1 as any)).resolves.toBe(true);
    });

    it("should coerce a falsy value to false", async () => {
      const schema = s.boolean({ preparations: { coerce: true } });
      await expect(schema.parse("" as any)).resolves.toBe(false);
      await expect(schema.parse(0 as any)).resolves.toBe(false);
    });

    it("should not coerce when disabled", async () => {
      const schema = s.boolean({ preparations: { coerce: false } });
      await expect(schema.parse("true" as any)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("stringBool", () => {
    const truthy = ["true", "1", "yes", "on", "y", "enabled"];
    truthy.forEach((value) => {
      it(`should coerce '${value}' to true`, async () => {
        const schema = s.boolean({ preparations: { stringBool: true } });
        await expect(schema.parse(value)).resolves.toBe(true);
      });
    });

    const falsy = ["false", "0", "no", "off", "n", "disabled"];
    falsy.forEach((value) => {
      it(`should coerce '${value}' to false`, async () => {
        const schema = s.boolean({ preparations: { stringBool: true } });
        await expect(schema.parse(value)).resolves.toBe(false);
      });
    });

    it("should not coerce an invalid string", async () => {
      const schema = s.boolean({ preparations: { stringBool: true } });
      await expect(schema.parse("tru")).rejects.toThrow(ValidationError);
    });
  });
});
