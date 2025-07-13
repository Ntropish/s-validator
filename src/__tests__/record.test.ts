import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../types.js";

describe("Original Record Validator", () => {
  it("should validate a record with string keys and string values", async () => {
    const schema = s.record(s.string(), s.string());
    const data = {
      name: "John Doe",
      email: "john.doe@example.com",
    };
    await expect(schema.parse(data)).resolves.toEqual(data);
  });

  it("should fail if a value does not match the value schema", async () => {
    const schema = s.record(s.string(), s.number());
    const data = {
      age: 30,
      score: "100", // Invalid value
    };
    await expect(schema.parse(data)).rejects.toThrow();
  });

  it("should fail if a key does not match the key schema", async () => {
    // Keys must be UUIDs
    const schema = s.record(s.string({ validate: { uuid: true } }), s.string());
    const data = {
      "f47ac10b-58cc-4372-a567-0e02b2c3d479": "valid",
      "not-a-uuid": "invalid",
    };
    await expect(schema.parse(data)).rejects.toThrow();
  });

  it("should handle numeric keys correctly", async () => {
    // NOTE: Object.keys() converts keys to strings. The string validator must handle this.
    const schema = s.record(s.string(), s.boolean());
    const data = {
      1: true,
      2: false,
    };
    await expect(schema.parse(data)).resolves.toEqual(data);
  });

  it("should fail for non-object inputs", async () => {
    const schema = s.record(s.string(), s.any());
    await expect(schema.parse(null)).rejects.toThrow();
    await expect(schema.parse(undefined)).rejects.toThrow();
    await expect(schema.parse([])).rejects.toThrow();
    await expect(schema.parse("a string" as any)).rejects.toThrow();
  });

  it("should handle empty objects", async () => {
    const schema = s.record(s.string(), s.any());
    await expect(schema.parse({})).resolves.toEqual({});
  });

  it("should handle complex nested records", async () => {
    const userSchema = s.object({
      validate: {
        properties: {
          name: s.string(),
          email: s.string({ validate: { email: true } }),
        },
      },
    });
    const schema = s.record(s.string({ validate: { uuid: true } }), userSchema);
    const data = {
      "f47ac10b-58cc-4372-a567-0e02b2c3d479": {
        name: "John Doe",
        email: "john@example.com",
      },
      "a47ac10b-58cc-4372-a567-0e02b2c3d480": {
        name: "Jane Doe",
        email: "jane@example.com",
      },
    };
    await expect(schema.parse(data)).resolves.toEqual(data);
  });

  it("should fail a nested record validation", async () => {
    const userSchema = s.object({
      validate: {
        properties: {
          name: s.string(),
          email: s.string({ validate: { email: true } }),
        },
      },
    });
    const schema = s.record(s.string({ validate: { uuid: true } }), userSchema);
    const data = {
      "f47ac10b-58cc-4372-a567-0e02b2c3d479": {
        name: "John Doe",
        email: "not-an-email", // Invalid email
      },
    };
    await expect(schema.parse(data)).rejects.toThrow();
  });
});

describe("Record Validator", () => {
  it("should validate a record", async () => {
    const schema = s.record(s.string(), s.number());
    const validRecord = { a: 1, b: 2 };
    await expect(schema.parse(validRecord)).resolves.toEqual(validRecord);
  });

  it("should throw for a non-record", async () => {
    const schema = s.record(s.string(), s.number());
    await expect(schema.parse(null)).rejects.toThrow(ValidationError);
    await expect(schema.parse([])).rejects.toThrow(ValidationError);
  });

  it("should validate record keys and values", async () => {
    const schema = s.record(
      s.string({ validate: { minLength: 2 } }),
      s.number({ validate: { positive: true } })
    );
    const valid = { aa: 1, bb: 2 };
    const invalidKey = { a: 1, bb: 2 };
    const invalidValue = { aa: 1, bb: -2 };

    await expect(schema.parse(valid)).resolves.toEqual(valid);
    await expect(schema.parse(invalidKey)).rejects.toThrow(ValidationError);
    await expect(schema.parse(invalidValue)).rejects.toThrow(ValidationError);
  });

  it("should handle minSize validator", async () => {
    const schema = s.record(s.any(), s.any(), { validate: { minSize: 2 } });
    await expect(schema.parse({ a: 1, b: 2 })).resolves.toBeDefined();
    await expect(schema.parse({ a: 1 })).rejects.toThrow(ValidationError);
  });

  it("should handle maxSize validator", async () => {
    const schema = s.record(s.any(), s.any(), { validate: { maxSize: 2 } });
    await expect(schema.parse({ a: 1, b: 2 })).resolves.toBeDefined();
    await expect(schema.parse({ a: 1, b: 2, c: 3 })).rejects.toThrow(
      ValidationError
    );
  });

  it("should handle size validator", async () => {
    const schema = s.record(s.any(), s.any(), { validate: { size: 2 } });
    await expect(schema.parse({ a: 1, b: 2 })).resolves.toBeDefined();
    await expect(schema.parse({ a: 1 })).rejects.toThrow(ValidationError);
    await expect(schema.parse({ a: 1, b: 2, c: 3 })).rejects.toThrow(
      ValidationError
    );
  });

  it("should handle nonEmpty validator", async () => {
    const schema = s.record(s.any(), s.any(), {
      validate: { nonEmpty: true },
    });
    await expect(schema.parse({ a: 1 })).resolves.toBeDefined();
    await expect(schema.parse({})).rejects.toThrow(ValidationError);
  });
});
