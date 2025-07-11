import { SchemaValidatorMap, ValidatorCollection } from "./types.js";

export const stringValidatorMap = {
  string: {
    identity: (value: unknown): value is string => typeof value === "string",
    length: (value: string, [length]: [number]) => value.length === length,
    minLength: (value: string, [minLength]: [number]) =>
      value.length >= minLength,
    maxLength: (value: string, [maxLength]: [number]) =>
      value.length <= maxLength,
    range: (value: string, [[min, max]]: [[number, number]]) =>
      value.length >= min && value.length <= max,
    exclusiveRange: (value: string, [[min, max]]: [[number, number]]) =>
      value.length > min && value.length < max,
    pattern: (value: string, [pattern]: [RegExp]) => pattern.test(value),
    oneOf: (value: string, [options]: [string[]]) => options.includes(value),
  } satisfies ValidatorCollection<string>,
} as const;
