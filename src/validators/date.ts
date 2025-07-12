import {
  ValidatorCollection,
  SchemaValidatorMap,
  PreparationCollection,
} from "./types.js";

export const datePreparations = {
  coerce: (value: unknown, [enabled]: [boolean?]) => {
    if (enabled === false) {
      return value;
    }
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return value;
  },
} satisfies PreparationCollection<Date>;

export const dateValidatorMap = {
  date: {
    identity: (value: unknown): value is Date => value instanceof Date,
    min: (value: Date, [minDate]: [Date]) =>
      value.getTime() >= minDate.getTime(),
    max: (value: Date, [maxDate]: [Date]) =>
      value.getTime() <= maxDate.getTime(),
  } satisfies ValidatorCollection<Date>,
} as const satisfies SchemaValidatorMap;
