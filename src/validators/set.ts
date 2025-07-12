import { SchemaValidatorMap, ValidatorCollection } from "./types.js";

export const setValidatorMap = {
  set: {
    identity: (value: unknown): value is Set<any> => value instanceof Set,
  } satisfies ValidatorCollection<Set<any>>,
} as const satisfies SchemaValidatorMap;
