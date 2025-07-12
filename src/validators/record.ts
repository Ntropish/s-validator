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
