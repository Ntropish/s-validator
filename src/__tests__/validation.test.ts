import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("Validation", () => {
  it("should validate a string", () => {
    s.string({
      length: 10,
    }).parse("1234567890");
  });

  it("should validate an object", () => {
    s.object({
      properties: {
        name: s.string({
          range: [1, 10],
        }),
        age: s.number({
          min: 18,
          max: 130,
        }),
      },
    }).parse({
      name: "John",
      age: 20,
    });
  });

  it("should use custom error messages when provided", () => {
    const customMessage = "Username must be at least 3 characters long.";
    const schema = s.string({
      minLength: 3,
      messages: {
        minLength: customMessage,
      },
    });

    expect(() => schema.parse("hi")).toThrow(customMessage);
  });
});
