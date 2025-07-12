import {
  definePlugin,
  Schema,
  ValidationError,
  ValidationIssue,
  ValidationContext,
} from "./types.js";

export const setPlugin = definePlugin({
  dataType: "set",
  validate: {
    identity: {
      validator: (value: unknown): value is Set<unknown> => {
        return value instanceof Set;
      },
      message: (ctx) =>
        `Invalid type. Expected Set, received ${typeof ctx.value}.`,
    },
    items: {
      validator: async (
        value: Set<unknown>,
        [valueSchema]: [Schema<any, any>],
        context: ValidationContext
      ) => {
        const issues: ValidationIssue[] = [];

        for (const val of value.values()) {
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
      message: (ctx) => `Set validation failed.`,
    },
  },
});
