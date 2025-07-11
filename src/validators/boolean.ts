import { SchemaValidatorMap, ValidatorCollection } from "./types.js";

export const booleanValidatorMap = {
  boolean: {
    identity: (value: unknown): value is boolean => typeof value === "boolean",
    required: (value: boolean) => typeof value === "boolean",
  } satisfies ValidatorCollection<boolean>,
} as const;
