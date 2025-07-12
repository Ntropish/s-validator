import { SchemaValidatorMap, ValidatorCollection } from "./types.js";

export const unknownValidatorMap = {
  unknown: {
    identity: (value: unknown): value is unknown => true,
  } satisfies ValidatorCollection<unknown>,
} as const satisfies SchemaValidatorMap;
