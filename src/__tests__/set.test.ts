import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../types.js";

describe("Set Validator", () => {
  it("should validate a set of primitives", async () => {
    const schema = s.set({ validate: { ofType: s.number() } });
    const input = new Set([1, 2, 3]);
    await expect(schema.parse(input)).resolves.toEqual(input);
  });

  it("should throw when a set contains an invalid primitive", async () => {
    const schema = s.set({ validate: { ofType: s.number() } });
    const input = new Set([1, "2", 3]);
    await expect(schema.parse(input)).rejects.toThrow(ValidationError);
  });

  it("should throw when the input is not a set", async () => {
    const schema = s.set({ validate: { ofType: s.any() } });
    const input = [1, 2, 3]; // Array, not a Set
    await expect(schema.parse(input as any)).rejects.toThrow(ValidationError);
  });

  it("should handle sets of objects", async () => {
    const userSchema = s.object({
      validate: { properties: { id: s.number(), name: s.string() } },
    });
    const schema = s.set({ validate: { ofType: userSchema } });
    const user1 = { id: 1, name: "Alice" };
    const user2 = { id: 2, name: "Bob" };
    const input = new Set([user1, user2]);
    await expect(schema.parse(input)).resolves.toEqual(input);
  });

  it("should throw when a set contains an invalid object", async () => {
    const userSchema = s.object({
      validate: { properties: { id: s.number(), name: s.string() } },
    });
    const schema = s.set({ validate: { ofType: userSchema } });
    const user1 = { id: 1, name: "Alice" };
    const user2 = { id: 2, name: 123 }; // Invalid name type
    const input = new Set([user1, user2]);
    await expect(schema.parse(input)).rejects.toThrow(ValidationError);
  });

  it("should apply transformations to set items", async () => {
    const schema = s.set({
      validate: {
        ofType: s.number({ transform: { custom: [(n: number) => n * 2] } }),
      },
    });
    const input = new Set([1, 2, 3]);
    const expected = new Set([2, 4, 6]);
    await expect(schema.parse(input)).resolves.toEqual(expected);
  });

  it("should provide correct error paths for invalid items", async () => {
    const schema = s.set({
      validate: { ofType: s.string({ validate: { minLength: 3 } }) },
    });
    const input = new Set(["abc", "de", "fghi"]);
    const result = await schema.safeParse(input);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.issues[0].path).toEqual([1]);
      expect(result.error.issues[0].message).toContain(
        "String must be at least 3 characters long"
      );
    }
  });

  it("should respect optional modifier", async () => {
    const schema = s.set({ validate: { ofType: s.number() }, optional: true });
    await expect(schema.parse(undefined)).resolves.toBeUndefined();
  });

  it("should respect nullable modifier", async () => {
    const schema = s.set({ validate: { ofType: s.number() }, nullable: true });
    await expect(schema.parse(null)).resolves.toBeNull();
  });

  it("should allow custom error messages for the set itself", async () => {
    const schema = s.set({
      validate: { ofType: s.any() },
      messages: { identity: "Input must be a Set" },
    });
    await expect(schema.parse([1, 2, 3] as any)).rejects.toThrow(
      "Input must be a Set"
    );
  });
});
