import {
  definePlugin,
  Schema,
  ValidationError,
  ValidationContext,
} from "./types.js";

export const recordPlugin = definePlugin<Record<any, any>>({
  dataType: "record",
  validate: {
    identity: {
      validator: async (
        value: unknown,
        [keySchema, valueSchema]: [
          Schema<any, any> | undefined,
          Schema<any, any> | undefined
        ],
        context: ValidationContext
      ) => {
        if (
          typeof value !== "object" ||
          value === null ||
          Array.isArray(value)
        ) {
          return false;
        }

        if (!keySchema || !valueSchema) return false;

        const issues: ValidationError[] = [];

        for (const [key, val] of Object.entries(value)) {
          try {
            await keySchema.parse(key, context);
            await valueSchema.parse(val, context);
          } catch (e) {
            if (e instanceof ValidationError) {
              issues.push(e);
            } else {
              throw e;
            }
          }
        }

        if (issues.length > 0) {
          throw new ValidationError(issues.flatMap((e) => e.issues));
        }

        return true;
      },
      message: (ctx) =>
        `Invalid type. Expected a record object, received ${typeof ctx.value}.`,
    },
  },
});
