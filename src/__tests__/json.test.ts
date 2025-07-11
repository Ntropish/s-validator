import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("json validator", () => {
  it("should validate a string containing JSON that matches the schema", () => {
    const schema = s.json({
      schema: s.object({
        properties: {
          name: s.string(),
          age: s.number(),
        },
      }),
    });

    const data = JSON.stringify({ name: "John Doe", age: 30 });
    expect(() => schema.parse(data)).not.toThrow();
  });

  it("should throw an error for a string containing JSON that does not match the schema", () => {
    const schema = s.json({
      schema: s.object({
        properties: {
          name: s.string(),
          age: s.number(),
        },
      }),
    });

    const data = JSON.stringify({ name: "John Doe", age: "30" }); // age is a string
    expect(() => schema.parse(data)).toThrow();
  });

  it("should throw an error for a string that is not valid JSON", () => {
    const schema = s.json({
      schema: s.object({
        properties: {
          name: s.string(),
        },
      }),
    });

    const data = "not a json string";
    expect(() => schema.parse(data)).toThrow();
  });

  it("should throw an error if the value is not a string", () => {
    const schema = s.json({
      schema: s.object({
        properties: {
          name: s.string(),
        },
      }),
    });

    const data = 123;
    expect(() => schema.parse(data as any)).toThrow();
  });

  it("should handle nested JSON schemas", () => {
    const schema = s.json({
      schema: s.object({
        properties: {
          user: s.object({
            properties: {
              name: s.string(),
              details: s.object({
                properties: {
                  tags: s.array({ ofType: s.string() }),
                },
              }),
            },
          }),
        },
      }),
    });

    const validData = JSON.stringify({
      user: {
        name: "test",
        details: {
          tags: ["a", "b", "c"],
        },
      },
    });
    expect(() => schema.parse(validData)).not.toThrow();

    const invalidData = JSON.stringify({
      user: {
        name: "test",
        details: {
          tags: ["a", "b", 3], // number instead of string in array
        },
      },
    });
    expect(() => schema.parse(invalidData)).toThrow();
  });
});
