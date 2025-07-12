import {
  SchemaValidatorMap,
  ValidatorCollection,
  PreparationCollection,
} from "./types.js";

export const bigintPreparations = {
  coerce: (value: unknown, [enabled]: [boolean?]) => {
    if (enabled === false) {
      return value;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      try {
        return BigInt(value);
      } catch {
        return value;
      }
    }

    return value;
  },
} satisfies PreparationCollection<bigint>;

export const bigintValidatorMap = {
  bigint: {
    identity: (value: unknown): value is bigint => typeof value === "bigint",
  } satisfies ValidatorCollection<bigint>,
} as const satisfies SchemaValidatorMap;
