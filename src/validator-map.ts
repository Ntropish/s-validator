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
import { setPlugin } from "./validators/set.js";
import { stringPlugin } from "./validators/string.js";
import { unknownPlugin } from "./validators/unknown.js";
import { literalPlugin } from "./validators/literal.js";
import { unionPlugin } from "./validators/union.js";
import { recordPlugin } from "./validators/record.js";

export const plugins: Validator<any, any>[] = [
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
  setPlugin,
  stringPlugin,
  unionPlugin,
  unknownPlugin,
];

export const validatorMap: SchemaValidatorMap = {};
export const preparationMap: Record<string, any> = {};
export const transformationMap: Record<string, any> = {};
export const messageMap: Record<string, any> = {};

for (const plugin of plugins) {
  const dataType = plugin.dataType;
  validatorMap[dataType] = validatorMap[dataType] || {
    identity: (value: any) => false,
  };
  preparationMap[dataType] = preparationMap[dataType] || {};
  transformationMap[dataType] = transformationMap[dataType] || {};
  messageMap[dataType] = messageMap[dataType] || {};

  if (plugin.prepare) {
    for (const name in plugin.prepare) {
      preparationMap[dataType][name] = plugin.prepare[name];
    }
  }
  if (plugin.validate) {
    for (const name in plugin.validate) {
      const validatorDef = plugin.validate[name]!;
      validatorMap[dataType][name] = validatorDef.validator;
      messageMap[dataType][name] = validatorDef.message;
    }
  }
  if (plugin.transform) {
    for (const name in plugin.transform) {
      transformationMap[dataType][name] = plugin.transform[name];
    }
  }
}
