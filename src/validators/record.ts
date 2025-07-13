import {
  definePlugin,
  ValidationError,
  ValidationIssue,
  ValidationContext,
} from "../types.js";
import { Schema } from "../schemas/schema.js";

export const recordPlugin = definePlugin({
  dataType: "record",
  validate: {
    identity: {
      validator: (value: unknown) => {
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        );
      },
      message: (ctx) =>
        `Invalid type. Expected a record object, received ${typeof ctx.value}.`,
    },
    minSize: {
      validator: (value: Record<string, unknown>, [min]: [number]) =>
        Object.keys(value).length >= min,
      message: (ctx) =>
        `${ctx.label} must contain at least ${ctx.args[0]} properties.`,
    },
    maxSize: {
      validator: (value: Record<string, unknown>, [max]: [number]) =>
        Object.keys(value).length <= max,
      message: (ctx) =>
        `${ctx.label} must contain at most ${ctx.args[0]} properties.`,
    },
    size: {
      validator: (value: Record<string, unknown>, [size]: [number]) =>
        Object.keys(value).length === size,
      message: (ctx) =>
        `${ctx.label} must contain exactly ${ctx.args[0]} properties.`,
    },
    nonEmpty: {
      validator: (value: Record<string, unknown>) =>
        Object.keys(value).length > 0,
      message: (ctx) => `${ctx.label} must not be empty.`,
    },
    keysAndValues: {
      validator: async (
        value: Record<string, unknown>,
        [keySchema, valueSchema]: [Schema<any, any>, Schema<any, any>],
        context: ValidationContext
      ) => {
        const issues: ValidationIssue[] = [];

        for (const [key, val] of Object.entries(value)) {
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
      message: (ctx) => `Record validation failed.`,
    },
  },
});
