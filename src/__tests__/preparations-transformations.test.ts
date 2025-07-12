import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("Preparations and Transformations", () => {
  describe("string preparations", () => {
    it("should coerce a number to a string", async () => {
      const schema = s.string({
        prepare: {
          coerce: true,
        },
      });
      await expect(schema.parse(123)).resolves.toBe("123");
    });

    it("should not coerce by default", async () => {
      const schema = s.string();
      await expect(schema.parse(123 as any)).rejects.toThrow();
    });
  });

  describe("string transformations", () => {
    it("should transform to uppercase", async () => {
      const schema = s.string({
        transform: {
          toUpperCase: true,
        },
      });
      await expect(schema.parse("hello")).resolves.toBe("HELLO");
    });

    it("should transform to lowercase", async () => {
      const schema = s.string({
        transform: {
          toLowerCase: true,
        },
      });
      await expect(schema.parse("HELLO")).resolves.toBe("hello");
    });

    it("should trim whitespace", async () => {
      const schema = s.string({
        transform: {
          trim: true,
        },
      });
      await expect(schema.parse("  hello  ")).resolves.toBe("hello");
    });

    it("should chain transformations in order", async () => {
      const schema = s.string({
        transform: {
          trim: true,
          toUpperCase: true,
        },
      });
      await expect(schema.parse("  hello  ")).resolves.toBe("HELLO");
    });
  });
});
