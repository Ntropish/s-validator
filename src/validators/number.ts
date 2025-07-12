import {
  SchemaValidatorMap,
  ValidatorCollection,
  PreparationCollection,
} from "./types.js";

const numberRegex = /^-?\d+(\.\d+)?$/;

export const numberPreparations = {
  coerce: (value: unknown, [enabled]: [boolean?]) => {
    if (enabled === false) {
      return value;
    }

    if (typeof value === "string" && numberRegex.test(value)) {
      return parseFloat(value);
    }

    return value;
  },
} satisfies PreparationCollection<number>;

export const numberValidatorMap = {
  number: {
    identity: (value: unknown): value is number =>
      typeof value === "number" && !isNaN(value),
    min: (value: number, [min]: [number]) => value >= min,
    max: (value: number, [max]: [number]) => value <= max,
    gt: (value: number, [num]: [number]) => value > num,
    gte: (value: number, [num]: [number]) => value >= num,
    lt: (value: number, [num]: [number]) => value < num,
    lte: (value: number, [num]: [number]) => value <= num,
    range: (value: number, [[min, max]]: [[number, number]]) =>
      value >= min && value <= max,
    exclusiveRange: (value: number, [[min, max]]: [[number, number]]) =>
      value > min && value < max,
    integer: (value: number) => Number.isInteger(value),
    positive: (value: number) => value > 0,
    negative: (value: number) => value < 0,
    zero: (value: number) => value === 0,
    float: (value: number) => !Number.isInteger(value),
    multipleOf: (value: number, [multipleOf]: [number]) =>
      value % multipleOf === 0,
    even: (value: number) => value % 2 === 0,
    odd: (value: number) => value % 2 !== 0,
  } satisfies ValidatorCollection<number>,
} as const;
