import {
  definePlugin,
  Schema,
  ValidationError,
  ValidationContext,
} from "./types.js";

export const setPlugin = definePlugin<Set<any>>({
  dataType: "set",
  validate: {
    identity: {
      validator: async (
        value: unknown,
        [valueSchema]: [Schema<any, any> | undefined],
        context: ValidationContext
      ) => {
        if (!(value instanceof Set)) return false;
        if (!valueSchema) return false;

        const issues: ValidationError[] = [];

        for (const val of value.values()) {
          try {
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
        `Invalid type. Expected Set, received ${typeof ctx.value}.`,
    },
  },
});
