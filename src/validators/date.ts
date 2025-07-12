import { ValidatorCollection, SchemaValidatorMap } from "./types.js";

export const dateValidatorMap = {
  date: {
    identity: (value: unknown): value is Date => value instanceof Date,
    min: (value: Date, [minDate]: [Date]) =>
      value.getTime() >= minDate.getTime(),
    max: (value: Date, [maxDate]: [Date]) =>
      value.getTime() <= maxDate.getTime(),
  } satisfies ValidatorCollection<Date>,
} as const satisfies SchemaValidatorMap;
