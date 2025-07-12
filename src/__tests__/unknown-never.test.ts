import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../validators/types.js";

describe("Unknown and Never Validators", () => {
  describe("unknown", () => {
    it("should validate any value", async () => {
      const schema = s.unknown();
      await expect(schema.parse(123)).resolves.toBe(123);
      await expect(schema.parse("hello")).resolves.toBe("hello");
      await expect(schema.parse(null)).resolves.toBe(null);
      await expect(schema.parse(undefined)).resolves.toBe(undefined);
      await expect(schema.parse({})).resolves.toEqual({});
    });
  });

  describe("never", () => {
    it("should throw for any value", async () => {
      const schema = s.never();
      // @ts-expect-error
      await expect(schema.parse(123)).rejects.toThrow(ValidationError);

      // @ts-expect-error
      await expect(schema.parse("hello")).rejects.toThrow(ValidationError);
      await expect(schema.parse(null)).rejects.toThrow(ValidationError);
      await expect(schema.parse(undefined)).rejects.toThrow(ValidationError);
      await expect((schema as any).parse({})).rejects.toThrow(ValidationError);
    });
  });
});
