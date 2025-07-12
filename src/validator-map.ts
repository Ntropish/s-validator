import { Intersect, UnionToIntersection } from "./utils.js";
import { arrayValidatorMap } from "./validators/array.js";
import { booleanValidatorMap } from "./validators/boolean.js";
import { numberValidatorMap } from "./validators/number.js";
import { objectValidatorMap } from "./validators/object.js";
import { stringValidatorMap } from "./validators/string.js";
import { SchemaValidatorMap } from "./validators/types.js";
import { dateValidatorMap } from "./validators/date.js";
import { anyValidatorMap } from "./validators/any.js";

type ValidatorMapUnion =
  | typeof stringValidatorMap
  | typeof numberValidatorMap
  | typeof booleanValidatorMap
  | typeof objectValidatorMap
  | typeof arrayValidatorMap
  | typeof dateValidatorMap
  | typeof anyValidatorMap;

type MergedValidators = Intersect<UnionToIntersection<ValidatorMapUnion>>;

export const validatorMap: MergedValidators = {
  ...stringValidatorMap,
  ...numberValidatorMap,
  ...booleanValidatorMap,
  ...objectValidatorMap,
  ...arrayValidatorMap,
  ...dateValidatorMap,
  ...anyValidatorMap,
};
