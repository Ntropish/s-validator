import { SchemaValidatorMap, ValidatorCollection } from "./types.js";

export const bigintValidatorMap = {
  bigint: {
    identity: (value: unknown): value is bigint => typeof value === "bigint",
  } satisfies ValidatorCollection<bigint>,
} as const satisfies SchemaValidatorMap;
