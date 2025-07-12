import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("Advanced Scenario", () => {
  const advancedSchema = s.object({
    properties: {
      // String with preparations, validations, and transformations
      username: s.string({
        prepare: {
          custom: [
            (v: unknown) => (typeof v === "string" ? v.toLowerCase() : v),
          ],
        },
        validate: {
          minLength: 3,
        },
        transform: {
          custom: [(v: string) => `@${v}`],
        },
      }),

      // Email with coercion and validation
      email: s.string({
        prepare: {
          trim: true,
          toLowerCase: true,
        },
        validate: {
          email: true,
        },
      }),

      // Number with coercion
      age: s.number({
        prepare: {
          coerce: true, // from string to number
        },
        validate: {
          min: 18,
        },
      }),

      // Boolean with coercion
      isSubscribed: s.boolean({
        prepare: {
          coerce: true, // from "true" or 1
        },
      }),

      // Array of objects
      posts: s.array({
        validate: {
          ofType: s.object({
            properties: {
              title: s.string({ validate: { minLength: 5 } }),
              content: s.string(),
              // A date that can be from a string
              createdAt: s.date({ prepare: { coerce: true } }),
            },
          }),
          minLength: 1,
        },
      }),
    },
    validate: {
      custom: [
        {
          validator: (v: any) => {
            // some complex cross-field validation
            if (v.username === "admin" && v.age < 99) {
              return false;
            }
            return true;
          },
          message: "Admin users must be at least 99 years old",
        },
      ],
    },
  });

  it("should correctly parse a complex object with preparations, validations and transformations", async () => {
    const validInput = {
      username: "JohnDoe",
      email: "  John.Doe@example.com  ",
      age: "30",
      isSubscribed: 1,
      posts: [
        {
          title: "First Post",
          content: "This is the first post.",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const expectedOutput = {
      username: "@johndoe",
      email: "john.doe@example.com",
      age: 30,
      isSubscribed: true,
      posts: [
        {
          title: "First Post",
          content: "This is the first post.",
          createdAt: new Date(validInput.posts[0].createdAt),
        },
      ],
    };

    const result = await advancedSchema.parse(validInput as any);
    expect(result).toEqual(expectedOutput);
  });

  it("should fail validation for invalid data", async () => {
    const invalidInput = {
      username: "ad", // too short
      email: "not-an-email",
      age: "17", // too young
      isSubscribed: "yes", // not a valid boolean string for coerce
      posts: [], // empty array
    };

    await expect(
      advancedSchema.safeParse(invalidInput as any)
    ).resolves.toEqual(
      expect.objectContaining({
        status: "error",
      })
    );
  });

  it("should fail custom validation rule", async () => {
    const invalidInput = {
      username: "admin",
      email: "admin@example.com",
      age: "98",
      isSubscribed: true,
      posts: [
        {
          title: "Admin Post",
          content: "...",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const result = await advancedSchema.safeParse(invalidInput as any);
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error.issues[0].message).toBe(
        "Admin users must be at least 99 years old"
      );
    }
  });
});
