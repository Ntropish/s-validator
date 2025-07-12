import { SchemaValidatorMap, ValidatorCollection } from "./types.js";

export const mapValidatorMap = {
  map: {
    identity: (value: unknown): value is Map<any, any> => value instanceof Map,
  } satisfies ValidatorCollection<Map<any, any>>,
} as const satisfies SchemaValidatorMap;
