import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("Switch Validator", () => {
  describe("Edge Cases", () => {
    it("should pass if no case matches and no default is provided", () => {
      interface TestRecord {
        type: "A" | "B";
        value: string;
      }
      const schema = s.object({
        properties: {
          type: s.string({ oneOf: ["A", "B"] }),
          value: s.switch((ctx) => (ctx.rootData as TestRecord)?.type, {
            A: s.string({ length: 1 }),
            B: s.string({ minLength: 3 }),
          }),
        },
      });

      // The key 'B' doesn't match 'A' and there's no default, so it passes.
      schema.parse({ type: "B", value: "any value" });
      expect(() => schema.parse({ type: "A", value: "too short" })).toThrow();
      expect(() => schema.parse({ type: "A", value: "1" })).not.toThrow();

      expect(() => schema.parse({ type: "B", value: "1" })).toThrow();
      expect(() => schema.parse({ type: "B", value: "123" })).not.toThrow();

      expect(() => schema.parse({ type: "C", value: "any value" })).toThrow();
    });

    it("should use the default schema if no case matches", () => {
      const schema = s.switch(
        (ctx) => (ctx.rootData as any)?.type,
        {
          A: s.string({ minLength: 5 }),
        },
        s.string({ maxLength: 3 })
      );

      // Fails default schema because the value is a string, but the rootData is not set
      expect(() => schema.parse("long string")).toThrow();
      // Passes default schema
      schema.parse("ok");
    });

    it("should use the default schema if the key function returns undefined", () => {
      const schema = s.switch(
        (ctx) => (ctx.rootData as any)?.nonExistentKey,
        {
          A: s.string({ minLength: 5 }),
        },
        s.string({ maxLength: 3 })
      );
      expect(() => schema.parse("too long for default")).toThrow();
    });

    it("should only apply the schema from the first matching case", () => {
      const schema = s.switch((ctx) => String(ctx.value.length), {
        "3": s.string({ pattern: /^[a-z]+$/ }), // only letters
      });

      schema.parse("abc");
      expect(() => schema.parse("123")).toThrow();
    });

    it("should handle nested switch statements correctly", () => {
      const schema = s.switch(
        (ctx) => (ctx.rootData as any).type,
        {
          A: s.switch((ctx) => (ctx.rootData as any).mode, {
            inner: s.string({ maxLength: 5 }),
          }),
        },
        s.string({ minLength: 10 })
      );

      // Test the nested switch
      const nestedSchema = s.object({ properties: { data: schema } });

      // Passes nested switch
      nestedSchema.parse({
        type: "A",
        mode: "inner",
        data: "short",
      });

      // Fails nested switch
      expect(() =>
        nestedSchema.parse({
          type: "A",
          mode: "inner",
          data: "toolong",
        })
      ).toThrow();

      // Passes outer default
      nestedSchema.parse({
        type: "B",
        data: "longenoughtopass",
      });
    });
  });

  describe("Practical Scenarios", () => {
    it("should validate different object shapes based on a type property", () => {
      const eventSchema = s.object({
        properties: {
          eventType: s.string({ oneOf: ["login", "purchase"] }),
          details: s.switch((ctx) => (ctx.rootData as any).eventType, {
            login: s.object({
              properties: { ip: s.string({ minLength: 1 }) },
            }),
            purchase: s.object({
              properties: { productId: s.number() },
            }),
          }),
        },
      });

      const loginEvent = {
        eventType: "login",
        details: { ip: "127.0.0.1" },
      };
      const purchaseEvent = {
        eventType: "purchase",
        details: { productId: 123 },
      };
      const invalidEvent = {
        eventType: "login",
        details: { productId: 456 },
      };

      expect(() => eventSchema.parse(loginEvent)).not.toThrow();
      expect(() => eventSchema.parse(purchaseEvent)).not.toThrow();
      expect(() => eventSchema.parse(invalidEvent)).toThrow();
    });
  });
});
