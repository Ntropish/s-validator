import {
  definePlugin,
  Schema,
  ValidationError,
  ValidationContext,
} from "./types.js";

type SwitchCase<T> = Record<string | number, Schema<T>>;
type SwitchDefault<T> = Schema<T> | undefined;

export type SwitchConfig = {
  select: (context: ValidationContext) => string | number;
  cases: SwitchCase<any>;
  default?: SwitchDefault<any>;
};

export const switchPlugin = definePlugin<any>({
  dataType: "switch",
  validate: {
    identity: {
      validator: async (
        value: unknown,
        args: [], // The config is on the schema, not passed as an argument
        context: ValidationContext,
        schema: Schema<any, any>
      ) => {
        const {
          select,
          cases,
          default: defaultSchema,
        } = schema.config as SwitchConfig;

        if (!select || !cases) {
          return true;
        }

        const key = select(context);
        const caseSchema = cases[key] || defaultSchema;

        if (caseSchema) {
          const result = await caseSchema.safeParse(value, context);
          if (result.status === "error") {
            throw result.error;
          }
        }
        return true;
      },
      message: (ctx) => `Switch validation failed.`,
    },
  },
});
