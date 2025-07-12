import {
  definePlugin,
  Schema,
  ValidationError,
  ValidationIssue,
  ValidationContext,
} from "./types.js";

export const objectPlugin = definePlugin<Record<string, any>>({
  dataType: "object",
  validate: {
    identity: {
      validator: async (
        value: unknown,
        args,
        context: ValidationContext,
        schema: Schema<any, any>
      ): Promise<boolean> => {
        if (
          typeof value !== "object" ||
          value === null ||
          Array.isArray(value)
        ) {
          return false;
        }

        const config = schema.config as {
          validate?: { properties?: Record<string, Schema<any, any>> };
          strict?: boolean;
        };
        const properties = config.validate?.properties;
        if (!properties) return true; // No properties to validate

        const issues: ValidationIssue[] = [];
        const allKeys = new Set([
          ...Object.keys(value),
          ...Object.keys(properties),
        ]);

        for (const key of allKeys) {
          const schema = properties[key];
          const propertyValue = (value as any)[key];
          const childContext = {
            ...context,
            path: [...context.path, key],
            value: propertyValue,
          };

          if (schema) {
            try {
              await schema.parse(propertyValue, childContext);
            } catch (e) {
              if (e instanceof ValidationError) {
                issues.push(...e.issues);
              } else {
                throw e;
              }
            }
          } else if (
            config.strict &&
            Object.prototype.hasOwnProperty.call(value, key)
          ) {
            issues.push({
              path: childContext.path,
              message: `Unrecognized key: '${key}'`,
            });
          }
        }

        if (issues.length > 0) {
          throw new ValidationError(issues);
        }

        return true;
      },
      message: (ctx) =>
        `Invalid type. Expected object, received ${typeof ctx.value}.`,
    },
  },
});
