import {
  definePlugin,
  Schema,
  ValidationError,
  ValidationIssue,
  ValidationContext,
} from "./types.js";

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
