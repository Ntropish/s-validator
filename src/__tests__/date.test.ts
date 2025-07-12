import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../types.js";

describe("Date Validator", () => {
  it("should validate a Date object", async () => {
    const schema = s.date();
    await expect(schema.parse(new Date())).resolves.toBeInstanceOf(Date);
  });

  it("should throw for a non-Date object", async () => {
    const schema = s.date();
    await expect(schema.parse("2023-01-01" as any)).rejects.toThrow(
      ValidationError
    );
  });

  describe("min", () => {
    it("should pass if the date is after the minimum", async () => {
      const minDate = new Date("2023-01-01");
      const schema = s.date({ validate: { min: minDate } });
      await expect(
        schema.parse(new Date("2023-01-02"))
      ).resolves.toBeInstanceOf(Date);
    });

    it("should throw if the date is before the minimum", async () => {
      const minDate = new Date("2023-01-01");
      const schema = s.date({ validate: { min: minDate } });
      await expect(schema.parse(new Date("2022-12-31"))).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("max", () => {
    it("should pass if the date is before the maximum", async () => {
      const maxDate = new Date("2023-01-01");
      const schema = s.date({ validate: { max: maxDate } });
      await expect(
        schema.parse(new Date("2022-12-31"))
      ).resolves.toBeInstanceOf(Date);
    });

    it("should throw if the date is after the maximum", async () => {
      const maxDate = new Date("2023-01-01");
      const schema = s.date({ validate: { max: maxDate } });
      await expect(schema.parse(new Date("2023-01-02"))).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("coerce", () => {
    it("should coerce a string to a Date object", async () => {
      const schema = s.date({ prepare: { coerce: true } });
      await expect(schema.parse("2023-01-01" as any)).resolves.toBeInstanceOf(
        Date
      );
    });

    it("should coerce a number to a Date object", async () => {
      const schema = s.date({ prepare: { coerce: true } });
      const timestamp = new Date("2023-01-01").getTime();
      await expect(schema.parse(timestamp as any)).resolves.toBeInstanceOf(
        Date
      );
    });

    it("should not coerce when disabled", async () => {
      const schema = s.date({ prepare: { coerce: false } });
      await expect(schema.parse("2023-01-01" as any)).rejects.toThrow(
        ValidationError
      );
    });
  });
});
