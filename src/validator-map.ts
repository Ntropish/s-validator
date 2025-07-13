import { Validator, SchemaValidatorMap } from "./types.js";
import { anyPlugin } from "./validators/any.js";
import { arrayPlugin } from "./validators/array.js";
import { bigintPlugin } from "./validators/bigint.js";
import { booleanPlugin } from "./validators/boolean.js";
import { datePlugin } from "./validators/date.js";
import { instanceofPlugin } from "./validators/instanceof.js";
import { mapPlugin } from "./validators/map.js";
import { nanPlugin } from "./validators/nan.js";
import { neverPlugin } from "./validators/never.js";
import { numberPlugin } from "./validators/number.js";
import { objectPlugin } from "./validators/object.js";
import { stringPlugin } from "./validators/string.js";
import { unknownPlugin } from "./validators/unknown.js";
import { literalPlugin } from "./validators/literal.js";
import { unionPlugin } from "./validators/union.js";
import { recordPlugin } from "./validators/record.js";
import { setPlugin } from "./validators/set.js";

export const basePlugins: Validator<any, any>[] = [
  anyPlugin,
  arrayPlugin,
  bigintPlugin,
  booleanPlugin,
  datePlugin,
  instanceofPlugin,
  literalPlugin,
  mapPlugin,
  nanPlugin,
  neverPlugin,
  numberPlugin,
  objectPlugin,
  recordPlugin,
  stringPlugin,
  unionPlugin,
  unknownPlugin,
  setPlugin,
];

export const baseValidatorMap: SchemaValidatorMap = {};
export const basePreparationMap: Record<string, any> = {};
export const baseTransformationMap: Record<string, any> = {};
export const baseMessageMap: Record<string, any> = {};

for (const plugin of basePlugins) {
  const dataType = plugin.dataType;
  baseValidatorMap[dataType] = baseValidatorMap[dataType] || {
    identity: (value: any) => false,
  };
  basePreparationMap[dataType] = basePreparationMap[dataType] || {};
  baseTransformationMap[dataType] = baseTransformationMap[dataType] || {};
  baseMessageMap[dataType] = baseMessageMap[dataType] || {};

  if (plugin.prepare) {
    for (const name in plugin.prepare) {
      basePreparationMap[dataType][name] = plugin.prepare[name];
    }
  }
  if (plugin.validate) {
    for (const name in plugin.validate) {
      const validatorDef = plugin.validate[name]!;
      baseValidatorMap[dataType][name] = validatorDef.validator;
      baseMessageMap[dataType][name] = validatorDef.message;
    }
  }
  if (plugin.transform) {
    for (const name in plugin.transform) {
      baseTransformationMap[dataType][name] = plugin.transform[name];
    }
  }
}
