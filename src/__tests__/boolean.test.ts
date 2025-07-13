import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../types.js";

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
      const schema = s.boolean({ prepare: { coerce: true } });
      await expect(schema.parse("hello" as any)).resolves.toBe(true);
      await expect(schema.parse(1 as any)).resolves.toBe(true);
    });

    it("should coerce a falsy value to false", async () => {
      const schema = s.boolean({ prepare: { coerce: true } });
      await expect(schema.parse("" as any)).resolves.toBe(false);
      await expect(schema.parse(0 as any)).resolves.toBe(false);
    });

    it("should not coerce when disabled", async () => {
      const schema = s.boolean({ prepare: { coerce: false } });
      await expect(schema.parse("true" as any)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("stringBool", () => {
    const truthy = ["true", "1", "yes", "on", "y", "enabled"];
    truthy.forEach((value) => {
      it(`should coerce '${value}' to true`, async () => {
        const schema = s.boolean({ prepare: { stringBool: true } });
        await expect(schema.parse(value)).resolves.toBe(true);
      });
    });

    const falsy = ["false", "0", "no", "off", "n", "disabled"];
    falsy.forEach((value) => {
      it(`should coerce '${value}' to false`, async () => {
        const schema = s.boolean({ prepare: { stringBool: true } });
        await expect(schema.parse(value)).resolves.toBe(false);
      });
    });

    it("should not coerce an invalid string", async () => {
      const schema = s.boolean({ prepare: { stringBool: true } });
      await expect(schema.parse("tru")).rejects.toThrow(ValidationError);
    });
  });

  describe("truthy/falsy", () => {
    it("should validate a truthy value", async () => {
      const schema = s.boolean({ validate: { truthy: true } });
      await expect(schema.parse(true)).resolves.toBe(true);
      await expect(schema.parse(false)).rejects.toThrow(ValidationError);
    });

    it("should validate a falsy value", async () => {
      const schema = s.boolean({ validate: { falsy: true } });
      await expect(schema.parse(false)).resolves.toBe(false);
      await expect(schema.parse(true)).rejects.toThrow(ValidationError);
    });

    it("should allow either when disabled", async () => {
      const truthySchema = s.boolean({ validate: { truthy: false } });
      await expect(truthySchema.parse(true)).resolves.toBe(true);
      await expect(truthySchema.parse(false)).resolves.toBe(false);

      const falsySchema = s.boolean({ validate: { falsy: false } });
      await expect(falsySchema.parse(true)).resolves.toBe(true);
      await expect(falsySchema.parse(false)).resolves.toBe(false);
    });
  });

  describe("transform", () => {
    it("should transform boolean to string", async () => {
      const schema = s.boolean({ transform: { toString: true } });
      await expect(schema.parse(true)).resolves.toBe("true");
      await expect(schema.parse(false)).resolves.toBe("false");
    });

    it("should transform boolean to custom strings", async () => {
      const schema = s.boolean({
        transform: {
          toString: {
            true: "active",
            false: "inactive",
          },
        },
      });
      await expect(schema.parse(true)).resolves.toBe("active");
      await expect(schema.parse(false)).resolves.toBe("inactive");
    });

    it("should transform boolean to number", async () => {
      const schema = s.boolean({ transform: { toNumber: true } });
      await expect(schema.parse(true)).resolves.toBe(1);
      await expect(schema.parse(false)).resolves.toBe(0);
    });
  });
});
