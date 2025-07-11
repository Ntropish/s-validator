import {
  SchemaValidatorMap,
  ValidatorCollection,
  SchemaLike,
} from "./types.js";

export const objectValidatorMap = {
  object: {
    identity: (value: unknown): value is object =>
      typeof value === "object" && value !== null && !Array.isArray(value),

    properties: (
      value: object,
      [properties]: [Record<string, SchemaLike>],
      context
    ) => {
      if (typeof value !== "object" || value === null) return false;

      for (const key in properties) {
        const schema: SchemaLike = properties[key];

        if (!Object.prototype.hasOwnProperty.call(value, key)) {
          if (schema.config.optional) {
            continue; // Property is optional and missing, so we skip it.
          }
          return false; // Property is required but missing.
        }

        const propertyValue = (value as any)[key];
        schema.parse({
          ...context,
          path: [...context.path, key],
          value: propertyValue,
        });
      }
      return true;
    },
  } satisfies ValidatorCollection<object>,
} as const;
