import { Intersect, UnionToIntersection } from "./utils.js";
import { arrayValidators } from "./validators/array.js";
import {
  booleanValidatorMap,
  booleanPreparations,
} from "./validators/boolean.js";
import { numberValidatorMap, numberPreparations } from "./validators/number.js";
import { objectValidators } from "./validators/object.js";
import {
  stringValidatorMap,
  stringPreparations,
  stringTransformations,
} from "./validators/string.js";
import { SchemaValidatorMap } from "./validators/types.js";
import { dateValidatorMap, datePreparations } from "./validators/date.js";
import { anyValidatorMap } from "./validators/any.js";
import { bigintValidatorMap, bigintPreparations } from "./validators/bigint.js";
import { nanValidatorMap } from "./validators/nan.js";
import { unknownValidatorMap } from "./validators/unknown.js";
import { neverValidatorMap } from "./validators/never.js";
import { mapValidatorMap } from "./validators/map.js";
import { setValidatorMap } from "./validators/set.js";
import { instanceofValidatorMap } from "./validators/instanceof.js";

const arrayValidatorMap = { array: arrayValidators };
const objectValidatorMap = { object: objectValidators };

type ValidatorMapUnion =
  | typeof stringValidatorMap
  | typeof numberValidatorMap
  | typeof booleanValidatorMap
  | typeof objectValidatorMap
  | typeof arrayValidatorMap
  | typeof dateValidatorMap
  | typeof anyValidatorMap
  | typeof bigintValidatorMap
  | typeof nanValidatorMap
  | typeof unknownValidatorMap
  | typeof neverValidatorMap
  | typeof mapValidatorMap
  | typeof setValidatorMap
  | typeof instanceofValidatorMap;

type MergedValidators = Intersect<UnionToIntersection<ValidatorMapUnion>>;

export const validatorMap: MergedValidators = {
  ...stringValidatorMap,
  ...numberValidatorMap,
  ...booleanValidatorMap,
  ...objectValidatorMap,
  ...arrayValidatorMap,
  ...dateValidatorMap,
  ...anyValidatorMap,
  ...bigintValidatorMap,
  ...nanValidatorMap,
  ...unknownValidatorMap,
  ...neverValidatorMap,
  ...mapValidatorMap,
  ...setValidatorMap,
  ...instanceofValidatorMap,
};

export const preparationMap = {
  string: stringPreparations,
  date: datePreparations,
  number: numberPreparations,
  bigint: bigintPreparations,
  boolean: booleanPreparations,
};

export const transformationMap = {
  string: stringTransformations,
};
