import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../types.js";

describe("Map Validator", () => {
  it("should validate a map", async () => {
    const schema = s.map(s.string(), s.number());
    const validMap = new Map([
      ["a", 1],
      ["b", 2],
    ]);
    await expect(schema.parse(validMap)).resolves.toEqual(validMap);
  });

  it("should throw for a non-map", async () => {
    const schema = s.map(s.string(), s.number());
    await expect(schema.parse({ a: 1 } as any)).rejects.toThrow(
      ValidationError
    );
  });

  it("should validate map keys and values", async () => {
    const schema = s.map(
      s.string({ validate: { minLength: 2 } }),
      s.number({ validate: { positive: true } })
    );
    const valid = new Map([
      ["aa", 1],
      ["bb", 2],
    ]);
    const invalidKey = new Map([["a", 1]]);
    const invalidValue = new Map([["bb", -2]]);

    await expect(schema.parse(valid)).resolves.toEqual(valid);
    await expect(schema.parse(invalidKey)).rejects.toThrow(ValidationError);
    await expect(schema.parse(invalidValue)).rejects.toThrow(ValidationError);
  });

  it("should handle minSize validator", async () => {
    const schema = s.map(s.any(), s.any(), { validate: { minSize: 2 } });
    await expect(
      schema.parse(
        new Map([
          ["a", 1],
          ["b", 2],
        ])
      )
    ).resolves.toBeDefined();
    await expect(schema.parse(new Map([["a", 1]]))).rejects.toThrow(
      ValidationError
    );
  });

  it("should handle maxSize validator", async () => {
    const schema = s.map(s.any(), s.any(), { validate: { maxSize: 2 } });
    await expect(
      schema.parse(
        new Map([
          ["a", 1],
          ["b", 2],
        ])
      )
    ).resolves.toBeDefined();
    await expect(
      schema.parse(
        new Map([
          ["a", 1],
          ["b", 2],
          ["c", 3],
        ])
      )
    ).rejects.toThrow(ValidationError);
  });

  it("should handle size validator", async () => {
    const schema = s.map(s.any(), s.any(), { validate: { size: 2 } });
    await expect(
      schema.parse(
        new Map([
          ["a", 1],
          ["b", 2],
        ])
      )
    ).resolves.toBeDefined();
    await expect(schema.parse(new Map([["a", 1]]))).rejects.toThrow(
      ValidationError
    );
    await expect(
      schema.parse(
        new Map([
          ["a", 1],
          ["b", 2],
          ["c", 3],
        ])
      )
    ).rejects.toThrow(ValidationError);
  });

  it("should handle nonEmpty validator", async () => {
    const schema = s.map(s.any(), s.any(), {
      validate: { nonEmpty: true },
    });
    await expect(schema.parse(new Map([["a", 1]]))).resolves.toBeDefined();
    await expect(schema.parse(new Map())).rejects.toThrow(ValidationError);
  });
});
