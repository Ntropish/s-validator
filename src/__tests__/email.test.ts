import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("Email Validator", () => {
  describe("identity", () => {
    it("should validate a correct email address", () => {
      const schema = s.string({ email: true });
      expect(() => schema.parse("test@example.com")).not.toThrow();
      expect(() => schema.parse("test.name@example.co.uk")).not.toThrow();
    });

    it("should throw an error for an invalid email address", () => {
      const schema = s.string({ email: true });
      expect(() => schema.parse("test@example")).toThrow();
      expect(() => schema.parse("test.example.com")).toThrow();
      expect(() => schema.parse("@example.com")).toThrow();
    });
  });

  describe("domain validation", () => {
    it("should allow emails from a specific list of domains", () => {
      const schema = s.string({
        email: { allowed: ["gmail.com", "yahoo.com"] },
      });
      expect(() => schema.parse("test@gmail.com")).not.toThrow();
      expect(() => schema.parse("test@yahoo.com")).not.toThrow();
      expect(() => schema.parse("test@outlook.com")).toThrow();
    });

    it("should deny emails from a specific list of domains", () => {
      const schema = s.string({
        email: { denied: ["temp-mail.org", "spam.com"] },
      });
      expect(() => schema.parse("test@gmail.com")).not.toThrow();
      expect(() => schema.parse("test@temp-mail.org")).toThrow();
    });

    it("should allow emails matching a regular expression", () => {
      const schema = s.string({ email: { allowed: [/\.edu$/] } });
      expect(() => schema.parse("student@university.edu")).not.toThrow();
      expect(() => schema.parse("test@gmail.com")).toThrow();
    });

    it("should deny emails matching a regular expression", () => {
      const schema = s.string({ email: { denied: [/^spam\./] } });
      expect(() => schema.parse("test@spam.domain.com")).toThrow();
      expect(() => schema.parse("test@gmail.com")).not.toThrow();
    });

    it("should prioritize deny over allow", () => {
      const schema = s.string({
        email: {
          allowed: ["allowed.com"],
          denied: ["allowed.com"],
        },
      });
      expect(() => schema.parse("test@allowed.com")).toThrow();
    });

    it("should handle complex regex rules correctly", () => {
      const schema = s.string({
        email: {
          allowed: [/^(?!mail\.).*\.company\.com$/], // Allow company.com but not mail.company.com
          denied: ["public.company.com"],
        },
      });
      expect(() => schema.parse("user@private.company.com")).not.toThrow();
      expect(() => schema.parse("user@mail.company.com")).toThrow();
      expect(() => schema.parse("user@public.company.com")).toThrow();
    });
  });
});
