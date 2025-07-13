import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { StandardSchemaV1 } from "../standard-schema.js";

describe("Standard Schema", () => {
  it("should have a ~standard property", () => {
    const schema = s.string();
    expect(schema).toHaveProperty("~standard");
    expect(schema["~standard"].version).toBe(1);
    expect(schema["~standard"].vendor).toBe("s-validator");
  });

  it("should validate successfully via the standard interface", async () => {
    const schema = s.string({ validate: { minLength: 3 } });
    const result = await schema["~standard"].validate("hello");
    if ("value" in result) {
      expect(result.issues).toBeUndefined();
      expect(result.value).toBe("hello");
    }
  });

  it("should fail validation via the standard interface", async () => {
    const schema = s.number();
    const result = await schema["~standard"].validate("not a number");

    if ("issues" in result) {
      expect(result.issues).toBeDefined();
      expect(result.issues).toHaveLength(1);

      const issue = result.issues?.[0];
      expect(issue?.message).toContain("Expected number, received string");
      expect(issue?.path).toEqual([]);
    }
  });

  it("should map the issue path correctly", async () => {
    const schema = s.object({
      validate: {
        properties: {
          user: s.object({
            validate: {
              properties: {
                name: s.string({ validate: { minLength: 10 } }),
              },
            },
          }),
        },
      },
    });

    const result = await schema["~standard"].validate({
      user: { name: "short" },
    });

    expect(result.issues).toBeDefined();
    expect(result.issues).toHaveLength(1);

    const issue = result.issues?.[0];
    expect(issue?.path).toEqual([{ key: "user" }, { key: "name" }]);
  });

  it("should infer types correctly", () => {
    const schema = s.object({
      validate: {
        properties: {
          name: s.string(),
          age: s.number(),
        },
      },
    });

    // This is a compile-time test. If it builds, it works.
    type SchemaType = StandardSchemaV1.InferOutput<typeof schema>;
    const data: SchemaType = { name: "test", age: 123 };

    expect(data).toBeDefined();
  });
});
