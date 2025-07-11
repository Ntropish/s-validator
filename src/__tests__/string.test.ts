import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("String Validators", () => {
  describe("url", () => {
    it("should validate a correct URL", () => {
      const schema = s.string({ url: true });
      expect(() => schema.parse("https://google.com")).not.toThrow();
      expect(() => schema.parse("http://example.com/some/path")).not.toThrow();
      expect(() => schema.parse("ftp://ftp.example.com")).not.toThrow();
    });

    it("should throw an error for an invalid URL", () => {
      const schema = s.string({ url: true });
      expect(() => schema.parse("google")).toThrow();
      expect(() => schema.parse("not a url")).toThrow();
    });
  });

  describe("uuid", () => {
    it("should validate a correct UUID", () => {
      const schema = s.string({ uuid: true });
      expect(() =>
        schema.parse("f47ac10b-58cc-4372-a567-0e02b2c3d479")
      ).not.toThrow();
      expect(() =>
        schema.parse("123e4567-e89b-12d3-a456-426614174000")
      ).not.toThrow();
    });

    it("should throw an error for an invalid UUID", () => {
      const schema = s.string({ uuid: true });
      expect(() => schema.parse("not-a-uuid")).toThrow();
      expect(() =>
        schema.parse("f47ac10b-58cc-4372-a567-0e02b2c3d479a")
      ).toThrow();
    });
  });

  describe("datetime", () => {
    it("should validate a correct ISO 8601 datetime string", () => {
      const schema = s.string({ datetime: true });
      expect(() => schema.parse("2023-10-27T10:00:00Z")).not.toThrow();
      expect(() => schema.parse("2023-10-27T10:00:00.123Z")).not.toThrow();
      expect(() => schema.parse("2023-10-27T10:00:00+05:30")).not.toThrow();
    });

    it("should throw an error for an invalid ISO 8601 datetime string", () => {
      const schema = s.string({ datetime: true });
      expect(() => schema.parse("2023-10-27 10:00:00")).toThrow();
      expect(() => schema.parse("not-a-datetime")).toThrow();
    });
  });
});
