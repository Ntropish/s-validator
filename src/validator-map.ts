import { SchemaValidatorMap } from "./validators/types.js";
// Validators
import { stringValidatorMap } from "./validators/string.js";
import { numberValidatorMap } from "./validators/number.js";
import { booleanValidatorMap } from "./validators/boolean.js";
import { arrayValidatorMap } from "./validators/array.js";
import { objectValidatorMap } from "./validators/object.js";
import { emailValidatorMap } from "./validators/email.js";

export const validatorMap = mergeValidatorMaps(
  stringValidatorMap,
  numberValidatorMap,
  booleanValidatorMap,
  arrayValidatorMap,
  objectValidatorMap,
  emailValidatorMap
);

/**
 * Merges one or more validator maps into a single validator map.
 * Later maps override validators from earlier maps when there are conflicts.
 *
 * @param maps - One or more validator maps to merge
 * @returns A new merged validator map
 */
export function mergeValidatorMaps<T extends Record<string, any>[]>(
  ...maps: T
): T extends readonly [infer A, infer B, infer C, infer D, infer E, infer F]
  ? A & B & C & D & E & F
  : T extends readonly [infer A, infer B, infer C, infer D, infer E]
  ? A & B & C & D & E
  : T extends readonly [infer A, infer B, infer C, infer D]
  ? A & B & C & D
  : T extends readonly [infer A, infer B, infer C]
  ? A & B & C
  : T extends readonly [infer A, infer B]
  ? A & B
  : T extends readonly [infer A]
  ? A
  : {} {
  const result = {} as any;

  for (const map of maps) {
    Object.assign(result, map);
  }

  return result;
}
