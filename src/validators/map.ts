import {
  definePlugin,
  ValidationError,
  ValidationIssue,
  ValidationContext,
} from "../types.js";
import { Schema } from "../schemas/schema.js";

export const mapPlugin = definePlugin({
  dataType: "map",
  validate: {
    identity: {
      validator: (value: unknown): value is Map<unknown, unknown> => {
        return value instanceof Map;
      },
      message: (ctx) =>
        `Invalid type. Expected Map, received ${typeof ctx.value}.`,
    },
    minSize: {
      validator: (value: Map<unknown, unknown>, [min]: [number]) =>
        value.size >= min,
      message: (ctx) =>
        `${ctx.label} must contain at least ${ctx.args[0]} entries.`,
    },
    maxSize: {
      validator: (value: Map<unknown, unknown>, [max]: [number]) =>
        value.size <= max,
      message: (ctx) =>
        `${ctx.label} must contain at most ${ctx.args[0]} entries.`,
    },
    size: {
      validator: (value: Map<unknown, unknown>, [size]: [number]) =>
        value.size === size,
      message: (ctx) =>
        `${ctx.label} must contain exactly ${ctx.args[0]} entries.`,
    },
    nonEmpty: {
      validator: (value: Map<unknown, unknown>) => value.size > 0,
      message: (ctx) => `${ctx.label} must not be empty.`,
    },
    entries: {
      validator: async (
        value: Map<unknown, unknown>,
        [keySchema, valueSchema]: [Schema<any, any>, Schema<any, any>],
        context: ValidationContext
      ) => {
        const issues: ValidationIssue[] = [];

        for (const [key, val] of value.entries()) {
          const keyResult = await keySchema.safeParse(key, context);
          if (keyResult.status === "error") {
            issues.push(...keyResult.error.issues);
          }

          const valueResult = await valueSchema.safeParse(val, context);
          if (valueResult.status === "error") {
            issues.push(...valueResult.error.issues);
          }
        }

        if (issues.length > 0) {
          throw new ValidationError(issues);
        }

        return true;
      },
      message: (ctx) => `Map validation failed.`,
    },
  },
});
