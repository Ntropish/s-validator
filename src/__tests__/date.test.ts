import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../validators/types.js";

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
      const schema = s.date({ min: minDate });
      await expect(
        schema.parse(new Date("2023-01-02"))
      ).resolves.toBeInstanceOf(Date);
    });

    it("should throw if the date is before the minimum", async () => {
      const minDate = new Date("2023-01-01");
      const schema = s.date({ min: minDate });
      await expect(schema.parse(new Date("2022-12-31"))).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("max", () => {
    it("should pass if the date is before the maximum", async () => {
      const maxDate = new Date("2023-01-01");
      const schema = s.date({ max: maxDate });
      await expect(
        schema.parse(new Date("2022-12-31"))
      ).resolves.toBeInstanceOf(Date);
    });

    it("should throw if the date is after the maximum", async () => {
      const maxDate = new Date("2023-01-01");
      const schema = s.date({ max: maxDate });
      await expect(schema.parse(new Date("2023-01-02"))).rejects.toThrow(
        ValidationError
      );
    });
  });
});
