import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("Record Validator", () => {
  it("should validate a record with string keys and string values", async () => {
    const schema = s.record({
      validate: { identity: [s.string(), s.string()] },
    });
    const data = {
      name: "John Doe",
      email: "john.doe@example.com",
    };
    await expect(schema.parse(data)).resolves.toEqual(data);
  });

  it("should fail if a value does not match the value schema", async () => {
    const schema = s.record({
      validate: { identity: [s.string(), s.number()] },
    });
    const data = {
      age: 30,
      score: "100", // Invalid value
    };
    await expect(schema.parse(data)).rejects.toThrow();
  });

  it("should fail if a key does not match the key schema", async () => {
    // Keys must be UUIDs
    const schema = s.record({
      validate: {
        identity: [s.string({ validate: { uuid: true } }), s.string()],
      },
    });
    const data = {
      "f47ac10b-58cc-4372-a567-0e02b2c3d479": "valid",
      "not-a-uuid": "invalid",
    };
    await expect(schema.parse(data)).rejects.toThrow();
  });

  it("should handle numeric keys correctly", async () => {
    // NOTE: Object.keys() converts keys to strings. The string validator must handle this.
    const schema = s.record({
      validate: { identity: [s.string(), s.boolean()] },
    });
    const data = {
      1: true,
      2: false,
    };
    await expect(schema.parse(data)).resolves.toEqual(data);
  });

  it("should fail for non-object inputs", async () => {
    const schema = s.record({ validate: { identity: [s.string(), s.any()] } });
    await expect(schema.parse(null)).rejects.toThrow();
    await expect(schema.parse(undefined)).rejects.toThrow();
    await expect(schema.parse([])).rejects.toThrow();
    await expect(schema.parse("a string")).rejects.toThrow();
  });

  it("should handle empty objects", async () => {
    const schema = s.record({ validate: { identity: [s.string(), s.any()] } });
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
    const schema = s.record({
      validate: {
        identity: [s.string({ validate: { uuid: true } }), userSchema],
      },
    });
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
    const schema = s.record({
      validate: {
        identity: [s.string({ validate: { uuid: true } }), userSchema],
      },
    });
    const data = {
      "f47ac10b-58cc-4372-a567-0e02b2c3d479": {
        name: "John Doe",
        email: "not-an-email", // Invalid email
      },
    };
    await expect(schema.parse(data)).rejects.toThrow();
  });
});
