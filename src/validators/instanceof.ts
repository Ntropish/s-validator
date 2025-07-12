import { SchemaValidatorMap, ValidatorCollection } from "./types.js";

export const instanceofValidatorMap = {
  instanceof: {
    identity: (value: unknown): value is object => typeof value === "object",
  } satisfies ValidatorCollection<object>,
} as const satisfies SchemaValidatorMap;
