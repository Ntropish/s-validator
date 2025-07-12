import { SchemaValidatorMap, ValidatorCollection } from "./types.js";

export const nanValidatorMap = {
  nan: {
    identity: (value: unknown): value is number => Number.isNaN(value),
  } satisfies ValidatorCollection<number>,
} as const satisfies SchemaValidatorMap;
