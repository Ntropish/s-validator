import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../validators/types.js";

describe("String Validator", () => {
  it("should validate a string", async () => {
    const schema = s.string();
    await expect(schema.parse("hello")).resolves.toBe("hello");
  });

  it("should throw an error for a non-string", async () => {
    const schema = s.string();
    await expect(schema.parse(123 as any)).rejects.toThrow(ValidationError);
  });

  describe("length", () => {
    it("should pass if the string has the correct length", async () => {
      const schema = s.string({ validate: { length: 5 } });
      await expect(schema.parse("hello")).resolves.toBe("hello");
    });

    it("should throw if the string does not have the correct length", async () => {
      const schema = s.string({ validate: { length: 5 } });
      await expect(schema.parse("hell")).rejects.toThrow(ValidationError);
    });
  });

  describe("minLength", () => {
    it("should pass if the string meets the minimum length", async () => {
      const schema = s.string({ validate: { minLength: 5 } });
      await expect(schema.parse("hello")).resolves.toBe("hello");
    });

    it("should throw if the string is shorter than the minimum length", async () => {
      const schema = s.string({ validate: { minLength: 5 } });
      await expect(schema.parse("hell")).rejects.toThrow(ValidationError);
    });
  });

  describe("maxLength", () => {
    it("should pass if the string is within the maximum length", async () => {
      const schema = s.string({ validate: { maxLength: 5 } });
      await expect(schema.parse("hello")).resolves.toBe("hello");
    });

    it("should throw if the string exceeds the maximum length", async () => {
      const schema = s.string({ validate: { maxLength: 5 } });
      await expect(schema.parse("hellos")).rejects.toThrow(ValidationError);
    });
  });

  describe("range", () => {
    it("should pass if the string length is within the range", async () => {
      const schema = s.string({ validate: { range: [3, 5] } });
      await expect(schema.parse("four")).resolves.toBe("four");
    });

    it("should throw if the string length is outside the range", async () => {
      const schema = s.string({ validate: { range: [3, 5] } });
      await expect(schema.parse("sixsix")).rejects.toThrow(ValidationError);
    });
  });

  describe("exclusiveRange", () => {
    it("should pass if the string length is exclusively within the range", async () => {
      const schema = s.string({ validate: { exclusiveRange: [3, 5] } });
      await expect(schema.parse("four")).resolves.toBe("four");
    });

    it("should throw if the string length is on the boundaries of the exclusive range", async () => {
      const schema = s.string({ validate: { exclusiveRange: [3, 5] } });
      await expect(schema.parse("three")).rejects.toThrow(ValidationError);
    });
  });

  describe("pattern", () => {
    it("should pass if the string matches the pattern", async () => {
      const schema = s.string({ validate: { pattern: /hello/ } });
      await expect(schema.parse("hello world")).resolves.toBe("hello world");
    });

    it("should throw if the string does not match the pattern", async () => {
      const schema = s.string({ validate: { pattern: /hello/ } });
      await expect(schema.parse("world")).rejects.toThrow(ValidationError);
    });
  });

  describe("oneOf", () => {
    it("should pass if the string is one of the options", async () => {
      const schema = s.string({ validate: { oneOf: ["a", "b", "c"] } });
      await expect(schema.parse("a")).resolves.toBe("a");
    });

    it("should throw if the string is not one of the options", async () => {
      const schema = s.string({ validate: { oneOf: ["a", "b", "c"] } });
      await expect(schema.parse("d")).rejects.toThrow(ValidationError);
    });
  });

  const regexTests = [
    { name: "cuid", value: "clgq0g2h2000008kygim3a3e4" },
    { name: "cuid2", value: "tz4a98xxat96iws9zmbrgj3a" },
    { name: "ulid", value: "01H2J3K4M5N6P7R8ST9VWCXEYZ" },
    { name: "emoji", value: "👍" },
    { name: "ipv4", value: "192.168.1.1" },
    { name: "ipv6", value: "2001:0db8:85a3:0000:0000:8a2e:0370:7334" },
    { name: "base64", value: "SGVsbG8gV29ybGQ=" },
    { name: "base64Url", value: "SGVsbG8gV29ybGQ" },
    { name: "date", value: "2023-01-01" },
    { name: "time", value: "12:34:56" },
    { name: "duration", value: "P3Y6M4DT12H30M5S" },
    { name: "hexColor", value: "#FF5733" },
    { name: "semver", value: "1.2.3" },
    { name: "url", value: "https://example.com" },
    { name: "uuid", value: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6" },
    { name: "uuidV7", value: "018f3a3a-79a4-73f1-ba5d-e79435368361" },
    { name: "datetime", value: "2023-01-01T12:34:56Z" },
  ];

  regexTests.forEach(({ name, value }) => {
    describe(name, () => {
      it(`should validate a correct ${name}`, async () => {
        const schema = s.string({ validate: { [name]: true } });
        await expect(schema.parse(value)).resolves.toBe(value);
      });

      it(`should throw for an incorrect ${name}`, async () => {
        const schema = s.string({ validate: { [name]: true } });
        await expect(schema.parse("invalid")).rejects.toThrow(ValidationError);
      });
    });
  });

  describe("email", () => {
    it("should validate a simple email", async () => {
      const schema = s.string({ validate: { email: true } });
      await expect(schema.parse("test@example.com")).resolves.toBe(
        "test@example.com"
      );
    });

    it("should throw for an invalid email", async () => {
      const schema = s.string({ validate: { email: true } });
      await expect(schema.parse("invalid-email")).rejects.toThrow(
        ValidationError
      );
    });

    it("should handle allowed domains", async () => {
      const schema = s.string({
        validate: { email: { allowed: ["example.com"] } },
      });
      await expect(schema.parse("test@example.com")).resolves.toBe(
        "test@example.com"
      );
    });

    it("should throw for a non-allowed domain", async () => {
      const schema = s.string({
        validate: { email: { allowed: ["example.com"] } },
      });
      await expect(schema.parse("test@gmail.com")).rejects.toThrow(
        ValidationError
      );
    });

    it("should handle denied domains", async () => {
      const schema = s.string({
        validate: { email: { denied: ["gmail.com"] } },
      });
      await expect(schema.parse("test@example.com")).resolves.toBe(
        "test@example.com"
      );
    });

    it("should throw for a denied domain", async () => {
      const schema = s.string({
        validate: { email: { denied: ["gmail.com"] } },
      });
      await expect(schema.parse("test@gmail.com")).rejects.toThrow(
        ValidationError
      );
    });
  });
});
