import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationContext, Schema } from "../validators/types.js";

describe("Switch Validator", () => {
  describe("Practical Scenarios", () => {
    it("should validate different object shapes based on a type property", async () => {
      const eventSchema = s.switch(
        (context: ValidationContext) => context.value.type,
        {
          USER_CREATED: s.object({
            properties: {
              type: s.string({ validate: { oneOf: ["USER_CREATED"] } }),
              userId: s.string({ validate: { uuid: true } }),
            },
          }),
          ORDER_PLACED: s.object({
            properties: {
              type: s.string({ validate: { oneOf: ["ORDER_PLACED"] } }),
              orderId: s.string({ validate: { cuid: true } }),
              amount: s.number(),
            },
          }),
        }
      );

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
      const schema = s.switch((c) => c.value.key, {
        a: s.string(),
      });
      const data = { key: "b" };
      await expect(schema.parse(data as any)).resolves.toEqual(data);
    });

    it("should use the default schema if no case matches", async () => {
      const schema = s.switch(
        (c) => c.value.key,
        {
          a: s.string({ validate: { minLength: 100 } }),
        },
        s.string({ validate: { maxLength: 5 } })
      );

      await expect(schema.parse("short")).resolves.toBe("short");
      await expect(schema.parse("this is way too long")).rejects.toThrow();
    });

    it("should use the default schema if the key function returns undefined", async () => {
      const schema = s.switch(
        (c) => c.value.missingKey, // this will be undefined
        {
          a: s.string({ validate: { minLength: 100 } }),
        },
        s.string({ validate: { maxLength: 5 } })
      );
      await expect(schema.parse("short" as any)).resolves.toBe("short");
    });

    it("should only apply the schema from the first matching case", async () => {
      // This is implicit in the design, but good to test
      const schema = s.switch(
        () => "a", // always match 'a'
        {
          a: s.string({ validate: { minLength: 3 } }),
        } as any // Cast to any to allow for the unused 'b' case for testing purposes
      );
      await expect(schema.parse("long")).resolves.toBe("long");
      await expect(schema.parse("s")).rejects.toThrow();
    });

    it("should handle nested switch statements correctly", async () => {
      const nestedSchema: Schema<any> = s.switch(
        (c) => (c.rootData as any).nestedKey, // check nestedKey on the root object
        {
          x: s.number({ validate: { min: 10 } }),
          y: s.string({ validate: { minLength: 10 } }),
        },
        s.any()
      );

      const schema = s.switch(
        (c) => c.value.key,
        {
          a: s.object({ properties: { value: nestedSchema } }),
        },
        s.any()
      );

      await expect(
        schema.parse({ key: "a", nestedKey: "x", value: 15 } as any)
      ).resolves.toEqual({ key: "a", nestedKey: "x", value: 15 });

      await expect(
        schema.parse({
          key: "a",
          nestedKey: "y",
          value: "long string",
        } as any)
      ).resolves.toEqual({
        key: "a",
        nestedKey: "y",
        value: "long string",
      });

      await expect(
        schema.parse({ key: "a", nestedKey: "x", value: 5 } as any)
      ).rejects.toThrow();
    });
  });
});
