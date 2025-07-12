import {
  definePlugin,
  Schema,
  ValidationError,
  ValidationContext,
} from "./types.js";

export const unionPlugin = definePlugin<any>({
  dataType: "union",
  validate: {
    identity: {
      validator: async (
        value: unknown,
        [schemas]: [Schema<any, any>[] | undefined],
        context: ValidationContext
      ) => {
        if (!schemas) return false;

        const issues = [];
        for (const schema of schemas) {
          try {
            await schema.parse(value, context);
            return true; // Stop on first success
          } catch (e) {
            if (e instanceof ValidationError) {
              issues.push(...e.issues);
            } else {
              throw e; // Rethrow unexpected errors
            }
          }
        }

        // If no schema passed, we will fail. We throw here to aggregate issues.
        throw new ValidationError(issues);
      },
      message: (ctx) => `No union variant matched the provided value.`,
    },
  },
});
