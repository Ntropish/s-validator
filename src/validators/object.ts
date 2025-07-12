import {
  definePlugin,
  Schema,
  ValidationError,
  ValidationIssue,
  ValidationContext,
} from "./types.js";

export const objectPlugin = definePlugin({
  dataType: "object",
  validate: {
    identity: {
      validator: (value: unknown): boolean => {
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        );
      },
      message: (ctx) =>
        `Invalid type. Expected object, received ${typeof ctx.value}.`,
    },
    properties: {
      validator: async (
        value: Record<string, any>,
        [shape]: [Record<string, Schema<any, any>>],
        context: ValidationContext,
        schema: Schema<any, any>
      ): Promise<boolean> => {
        const issues: ValidationIssue[] = [];
        const { strict } = schema.config as { strict?: boolean };
        const allKeys = new Set([...Object.keys(value), ...Object.keys(shape)]);

        for (const key of allKeys) {
          const propertySchema = shape[key];
          const propertyValue = value[key];
          const propertyContext = {
            ...context,
            path: [...context.path, key],
          };

          if (propertySchema) {
            try {
              await propertySchema._validate(propertyValue, propertyContext);
            } catch (e) {
              if (e instanceof ValidationError) {
                issues.push(...e.issues);
              } else {
                throw e;
              }
            }
          } else if (
            strict &&
            Object.prototype.hasOwnProperty.call(value, key)
          ) {
            issues.push({
              path: propertyContext.path,
              message: `Unrecognized key: '${key}'`,
            });
          }
        }

        if (issues.length > 0) {
          throw new ValidationError(issues);
        }

        return true;
      },
      message: () => `Object properties are invalid.`,
    },
  },
  transform: {
    properties: async (
      value: Record<string, any>,
      [shape]: [Record<string, Schema<any, any>>],
      context: ValidationContext
    ): Promise<Record<string, any>> => {
      const transformedObject: Record<string, any> = { ...value };
      for (const key in shape) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const propertySchema = shape[key];
          const propertyValue = value[key];
          const propertyContext = { ...context, path: [...context.path, key] };
          transformedObject[key] = await propertySchema._transform(
            propertyValue,
            propertyContext
          );
        }
      }
      // Return a new object with only the defined properties
      const finalObject: Record<string, any> = {};
      for (const key of Object.keys(shape)) {
        if (Object.prototype.hasOwnProperty.call(transformedObject, key)) {
          finalObject[key] = transformedObject[key];
        }
      }
      return finalObject;
    },
  },
});
