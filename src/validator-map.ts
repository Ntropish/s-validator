import { SchemaValidatorMap } from "./validators/types.js";
// Validators
import { stringValidatorMap } from "./validators/string.js";
import { numberValidatorMap } from "./validators/number.js";
import { booleanValidatorMap } from "./validators/boolean.js";
import { arrayValidatorMap } from "./validators/array.js";
import { objectValidatorMap } from "./validators/object.js";
import { emailValidatorMap } from "./validators/email.js";
import { jsonValidatorMap } from "./validators/json.js";

export const validatorMap = mergeValidatorMaps(
  stringValidatorMap,
  numberValidatorMap,
  booleanValidatorMap,
  arrayValidatorMap,
  objectValidatorMap,
  emailValidatorMap,
  jsonValidatorMap
);

// A recursive type to intersect all types in a tuple.
type Intersect<T extends readonly any[]> = T extends readonly [
  infer Head,
  ...infer Tail
]
  ? Head & Intersect<Tail>
  : {};

/**
 * Merges one or more validator maps into a single validator map.
 * Later maps override validators from earlier maps when there are conflicts.
 *
 * @param maps - One or more validator maps to merge
 * @returns A new merged validator map
 */
export function mergeValidatorMaps<T extends readonly Record<string, any>[]>(
  ...maps: readonly [...T]
): Intersect<T> {
  const result = {} as any;

  for (const map of maps) {
    Object.assign(result, map);
  }

  return result;
}
