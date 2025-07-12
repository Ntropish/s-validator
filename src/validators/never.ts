import { SchemaValidatorMap, ValidatorCollection } from "./types.js";

export const neverValidatorMap = {
  never: {
    identity: (value: unknown): value is never => false,
  } satisfies ValidatorCollection<never>,
} as const satisfies SchemaValidatorMap;
