import { SchemaValidatorMap, ValidatorCollection } from "./types.js";

export const anyValidatorMap = {
  any: {
    identity: (value: unknown): value is any => true,
  } satisfies ValidatorCollection<any>,
} as const;
