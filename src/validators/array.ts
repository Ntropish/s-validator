import { definePlugin, ValidationError, ValidationContext } from "./types.js";
import type { Schema } from "../index.js";

export const arrayPlugin = definePlugin<any[]>({
  dataType: "array",
  validate: {
    identity: {
      validator: (value: unknown): value is any[] => Array.isArray(value),
      message: (ctx) =>
        `Invalid type. Expected array, received ${typeof ctx.value}.`,
    },
    length: {
      validator: (value: any[], [length]: [number]) => value.length === length,
      message: (ctx) =>
        `${ctx.label} must contain exactly ${ctx.args[0]} items.`,
    },
    minLength: {
      validator: (value: any[], [minLength]: [number]) =>
        value.length >= minLength,
      message: (ctx) =>
        `${ctx.label} must contain at least ${ctx.args[0]} items.`,
    },
    maxLength: {
      validator: (value: any[], [maxLength]: [number]) =>
        value.length <= maxLength,
      message: (ctx) =>
        `${ctx.label} must contain at most ${ctx.args[0]} items.`,
    },
    nonEmpty: {
      validator: (value: any[]) => value.length > 0,
      message: (ctx) => `${ctx.label} must not be empty.`,
    },
    contains: {
      validator: (value: any[], [element]: [any]) => value.includes(element),
      message: (ctx) => `${ctx.label} must contain the element ${ctx.args[0]}.`,
    },
    excludes: {
      validator: (value: any[], [element]: [any]) => !value.includes(element),
      message: (ctx) =>
        `${ctx.label} must not contain the element ${ctx.args[0]}.`,
    },
    unique: {
      validator: (value: any[]) => new Set(value).size === value.length,
      message: (ctx) => `${ctx.label} must contain unique items.`,
    },
    ofType: {
      async validator(
        value: any[],
        [schema]: [Schema<any, any>],
        context: ValidationContext
      ) {
        for (let i = 0; i < value.length; i++) {
          const result = await schema.safeParse(value[i], context.ctx);
          if (result.status === "error") {
            const issues = result.error.issues.map((issue) => ({
              ...issue,
              path: [...context.path, i, ...issue.path],
            }));
            throw new ValidationError(issues);
          }
        }
        return true;
      },
      message: () => `Invalid item in array.`,
    },
    items: {
      async validator(
        value: any[],
        schemas: Schema<any, any>[],
        context: ValidationContext
      ) {
        if (value.length !== schemas.length) {
          throw new ValidationError([
            {
              message: `Expected ${schemas.length} items, but received ${value.length}.`,
              path: context.path,
            },
          ]);
        }
        for (let i = 0; i < schemas.length; i++) {
          const result = await schemas[i].safeParse(value[i], context.ctx);
          if (result.status === "error") {
            const issues = result.error.issues.map((issue) => ({
              ...issue,
              path: [...context.path, i, ...issue.path],
            }));
            throw new ValidationError(issues);
          }
        }
        return true;
      },
      message: () => `Invalid tuple item.`,
    },
  },
});
