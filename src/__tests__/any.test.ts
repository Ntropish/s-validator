import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("Any Validator", () => {
  it("should pass for any value", async () => {
    const schema = s.any();
    await expect(schema.parse(123)).resolves.toBe(123);
    await expect(schema.parse("hello")).resolves.toBe("hello");
    await expect(schema.parse(null)).resolves.toBe(null);
    await expect(schema.parse(undefined)).resolves.toBe(undefined);
    await expect(schema.parse({})).resolves.toEqual({});
    await expect(schema.parse([])).resolves.toEqual([]);
    await expect(schema.parse(new Date())).resolves.toBeInstanceOf(Date);
  });

  it("should have an `any` type inference", () => {
    const schema = s.any();
    type Inferred = s.infer<typeof schema>;
    const value: Inferred = "string"; // Can be any type
    expect(typeof value).toBe("string");
  });
});
