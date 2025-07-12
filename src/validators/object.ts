import {
  SchemaValidatorMap,
  ValidatorCollection,
  SchemaLike,
} from "./types.js";

export const objectValidatorMap = {
  object: {
    identity: (value: unknown): value is object =>
      typeof value === "object" && value !== null && !Array.isArray(value),

    properties: async (
      value: object,
      [properties]: [Record<string, SchemaLike>],
      context,
      schema
    ) => {
      if (typeof value !== "object" || value === null) return false;

      if (schema.config.strict) {
        const schemaKeys = Object.keys(properties);
        const valueKeys = Object.keys(value);
        for (const key of valueKeys) {
          if (!schemaKeys.includes(key)) {
            return false; // Found a key not in the schema
          }
        }
      }

      for (const key in properties) {
        const schema: SchemaLike = properties[key];

        if (!Object.prototype.hasOwnProperty.call(value, key)) {
          if (schema.config.optional) {
            continue; // Property is optional and missing, so we skip it.
          }
          return false; // Property is required but missing.
        }

        const propertyValue = (value as any)[key];
        const result = await schema.safeParse({
          ...context,
          path: [...context.path, key],
          value: propertyValue,
        });

        if (result.status === "error") {
          throw result.error;
        }
      }

      return true;
    },
  } satisfies ValidatorCollection<object>,
} as const;
