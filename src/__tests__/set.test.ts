import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../types.js";

describe("Set Validator", () => {
  it("should validate a set", async () => {
    const schema = s.set({ validate: { ofType: s.string() } });
    const testSet = new Set(["a", "b"]);
    await expect(schema.parse(testSet)).resolves.toEqual(testSet);
  });

  it("should throw for a non-set", async () => {
    const schema = s.set({ validate: { ofType: s.string() } });
    // @ts-expect-error - we want to test the error
    await expect(schema.parse(["a", "b"])).rejects.toThrow(ValidationError);
  });

  it("should validate the type of items in the set", async () => {
    const schema = s.set({ validate: { ofType: s.number() } });
    const validSet = new Set([1, 2, 3]);
    const invalidSet = new Set([1, "2", 3]);
    await expect(schema.parse(validSet)).resolves.toEqual(validSet);
    await expect(schema.parse(invalidSet)).rejects.toThrow(ValidationError);
  });

  it("should handle minSize validator", async () => {
    const schema = s.set({ validate: { ofType: s.any(), minSize: 2 } });
    await expect(schema.parse(new Set([1, 2]))).resolves.toBeDefined();
    await expect(schema.parse(new Set([1]))).rejects.toThrow(ValidationError);
  });

  it("should handle maxSize validator", async () => {
    const schema = s.set({ validate: { ofType: s.any(), maxSize: 2 } });
    await expect(schema.parse(new Set([1, 2]))).resolves.toBeDefined();
    await expect(schema.parse(new Set([1, 2, 3]))).rejects.toThrow(
      ValidationError
    );
  });

  it("should handle size validator", async () => {
    const schema = s.set({ validate: { ofType: s.any(), size: 2 } });
    await expect(schema.parse(new Set([1, 2]))).resolves.toBeDefined();
    await expect(schema.parse(new Set([1]))).rejects.toThrow(ValidationError);
    await expect(schema.parse(new Set([1, 2, 3]))).rejects.toThrow(
      ValidationError
    );
  });

  it("should handle nonEmpty validator", async () => {
    const schema = s.set({ validate: { ofType: s.any(), nonEmpty: true } });
    await expect(schema.parse(new Set([1]))).resolves.toBeDefined();
    await expect(schema.parse(new Set())).rejects.toThrow(ValidationError);
  });
});
