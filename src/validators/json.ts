import {
  ValidatorCollection,
  SchemaLike,
  SchemaValidatorMap,
} from "./types.js";

export const jsonValidatorMap = {
  json: {
    identity: (value: unknown): value is string => typeof value === "string",
    schema: (value: string, [schema]: [SchemaLike], context) => {
      try {
        const parsed = JSON.parse(value);
        schema.parse({ ...context, value: parsed });
        return true;
      } catch (e) {
        return false;
      }
    },
  } satisfies ValidatorCollection<string>,
} as const satisfies SchemaValidatorMap;
