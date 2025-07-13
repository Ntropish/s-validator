import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../types.js";

class TestClass {}

describe("Advanced Type Validators", () => {
  describe("map", () => {
    it("should validate a correct map", async () => {
      const schema = s.map(s.string(), s.number());
      const map = new Map([
        ["a", 1],
        ["b", 2],
      ]);
      await expect(schema.parse(map)).resolves.toEqual(map);
    });

    it("should throw for an invalid key", async () => {
      const schema = s.map(s.string(), s.number());
      const map = new Map([[1, 1]]);
      await expect(schema.parse(map)).rejects.toThrow(ValidationError);
    });

    it("should throw for an invalid value", async () => {
      const schema = s.map(s.string(), s.number());
      const map = new Map([["a", "1"]]);
      await expect(schema.parse(map)).rejects.toThrow(ValidationError);
    });
  });

  describe("set", () => {
    it("should validate a correct set", async () => {
      const schema = s.set({
        validate: { ofType: s.number() },
      });
      const set = new Set([1, 2, 3]);
      await expect(schema.parse(set)).resolves.toEqual(set);
    });

    it("should throw for an invalid value in a set", async () => {
      const schema = s.set({
        validate: { ofType: s.number() },
      });
      const set = new Set([1, "2", 3]);
      await expect((schema as any).parse(set)).rejects.toThrow(ValidationError);
    });
  });

  describe("instanceof", () => {
    it("should validate a correct class instance", async () => {
      const schema = s.instanceof(TestClass);
      const instance = new TestClass();
      await expect(schema.parse(instance)).resolves.toBe(instance);
    });

    it("should throw for an incorrect class instance", async () => {
      const schema = s.instanceof(TestClass);
      await expect((schema as any).parse({})).rejects.toThrow(ValidationError);
    });
  });
});
