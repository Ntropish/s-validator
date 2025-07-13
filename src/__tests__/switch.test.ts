import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationContext, ValidationError } from "../types.js";
import { Schema } from "../schemas/schema.js";

describe("Switch Validator", () => {
  describe("Practical Scenarios", () => {
    it("should validate different object shapes based on a type property", async () => {
      const eventSchema = s.switch({
        select: (context: ValidationContext) => context.value.type,
        cases: {
          USER_CREATED: s.object({
            validate: {
              properties: {
                type: s.string({ validate: { oneOf: ["USER_CREATED"] } }),
                userId: s.string({ validate: { uuid: true } }),
              },
            },
          }),
          ORDER_PLACED: s.object({
            validate: {
              properties: {
                type: s.string({ validate: { oneOf: ["ORDER_PLACED"] } }),
                orderId: s.string({ validate: { cuid: true } }),
                amount: s.number(),
              },
            },
          }),
        },
      });

      const userEvent = {
        type: "USER_CREATED" as const,
        userId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      };
      await expect(eventSchema.parse(userEvent)).resolves.toEqual(userEvent);

      const orderEvent = {
        type: "ORDER_PLACED" as const,
        orderId: "caaaaaaaaaaaaaaaaaaaaaaaa",
        amount: 100,
      };
      await expect(eventSchema.parse(orderEvent)).resolves.toEqual(orderEvent);

      const invalidEvent = { type: "INVALID_EVENT" as const };
      await expect(eventSchema.parse(invalidEvent)).resolves.toEqual(
        invalidEvent
      ); // No default, so it passes
    });
  });

  describe("Edge Cases", () => {
    it("should pass if no case matches and no default is provided", async () => {
      const schema = s.switch({
        select: (c) => c.value.key,
        cases: {
          a: s.string(),
        },
      });
      const data = { key: "b" };
      await expect(schema.parse(data as any)).resolves.toEqual(data);
    });

    it("should handle nested switch statements correctly", async () => {
      const nestedSchema: Schema<any> = s.switch({
        select: (c) => {
          return c.rootData.nestedKey;
        },
        cases: {
          x: s.number({ validate: { min: 10 } }),
          y: s.string({ validate: { minLength: 10 } }),
        },
        failOnNoMatch: true,
      });

      const schema = s.switch({
        select: (c) => c.value.key,
        cases: {
          a: s.object({
            validate: { properties: { value: nestedSchema } },
          }),
        },
      });

      // This should pass because the nested schema's min validation passes
      await expect(
        schema.parse({ key: "a", nestedKey: "x", value: 15 })
      ).resolves.toEqual({ key: "a", nestedKey: "x", value: 15 });

      // This should fail because the nested schema's min validation fails
      await expect(
        schema.parse({ key: "a", nestedKey: "x", value: 5 } as any)
      ).rejects.toThrow(ValidationError);

      // This should fail because the nested key 'z' is not a valid case
      await expect(
        schema.parse({ key: "a", nestedKey: "z", value: 5 } as any)
      ).rejects.toThrow(ValidationError);
    });

    it("should use the default schema if no case matches", async () => {
      const schema = s.switch({
        select: (ctx) => (ctx.value as any).key,
        cases: {
          a: s.string({ validate: { minLength: 100 } }),
        },
        default: s.string({ validate: { maxLength: 5 } }),
      });

      await expect(schema.parse("short")).resolves.toBe("short");
      await expect(schema.parse("this is way too long")).rejects.toThrow();
    });

    it("should use the default schema if the key function returns undefined", async () => {
      const schema = s.switch({
        select: (c) => c.value.missingKey, // this will be undefined
        cases: {
          a: s.string({ validate: { minLength: 100 } }),
        },
        default: s.string({ validate: { maxLength: 5 } }),
      });
      await expect(schema.parse("short" as any)).resolves.toBe("short");
    });

    it("should only apply the schema from the first matching case", async () => {
      // This is implicit in the design, but good to test
      const schema = s.switch({
        select: () => "a", // always match 'a'
        cases: {
          a: s.string({ validate: { minLength: 3 } }),
        } as any,
      }); // Cast to any to allow for the unused 'b' case for testing purposes
      await expect(schema.parse("long")).resolves.toBe("long");
      await expect(schema.parse("s")).rejects.toThrow();
    });
  });

  describe("Top-level modifiers", () => {
    it("should apply top-level preparations", async () => {
      const schema = s.switch({
        select: (c) => c.value.key,
        cases: {
          a: s.object({
            validate: { properties: { value: s.number() } },
          }),
        },
        prepare: {
          custom: [
            (data) => {
              if (typeof data.value === "string") {
                return { ...data, value: Number(data.value) };
              }
              return data;
            },
          ],
        },
      });

      const input = { key: "a", value: "123" };
      const expected = { key: "a", value: 123 };
      await expect(schema.parse(input)).resolves.toEqual(expected);
    });

    it("should apply top-level transformations", async () => {
      const schema = s.switch({
        select: (c) => c.value.key,
        cases: {
          a: s.object({
            validate: { properties: { value: s.number() } },
          }),
        },
        transform: {
          custom: [
            (data) => {
              return { ...data, transformed: true };
            },
          ],
        },
      });

      const input = { key: "a", value: 123 };
      const expected = { key: "a", value: 123, transformed: true };
      await expect(schema.parse(input)).resolves.toEqual(expected);
    });

    it("should apply top-level validations with custom messages", async () => {
      const customMessage = "Top-level validation failed";
      const schema = s.switch({
        select: (c) => c.value.key,
        cases: {
          a: s.object({
            validate: { properties: { value: s.number() } },
          }),
        },
        validate: {
          custom: [
            {
              name: "top_level_check",
              validator: (data) => data.value > 100,
            },
          ],
        },
        messages: {
          top_level_check: customMessage,
        },
      });

      await expect(
        schema.parse({ key: "a", value: 101 })
      ).resolves.not.toThrow();
      const result = await schema.safeParse({ key: "a", value: 99 });
      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.error.issues[0].message).toBe(customMessage);
      }
    });
  });
});
