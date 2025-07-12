import {
  SchemaValidatorMap,
  ValidatorCollection,
  PreparationCollection,
} from "./types.js";

const truthyStrings = new Set(["true", "1", "yes", "on", "y", "enabled"]);
const falsyStrings = new Set(["false", "0", "no", "off", "n", "disabled"]);

export const booleanPreparations = {
  coerce: (value: unknown, [enabled]: [boolean?]) => {
    if (enabled === false) {
      return value;
    }
    return !!value;
  },
  stringBool: (value: unknown, [enabled]: [boolean?]) => {
    if (enabled === false) {
      return value;
    }
    if (typeof value === "string") {
      const lowerValue = value.toLowerCase();
      if (truthyStrings.has(lowerValue)) {
        return true;
      }
      if (falsyStrings.has(lowerValue)) {
        return false;
      }
    }
    return value;
  },
} satisfies PreparationCollection<boolean>;

export const booleanValidatorMap = {
  boolean: {
    identity: (value: unknown): value is boolean => typeof value === "boolean",
    required: (value: boolean) => typeof value === "boolean",
  } satisfies ValidatorCollection<boolean>,
} as const;
