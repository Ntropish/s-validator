import { Plugin, SchemaValidatorMap } from "./validators/types.js";
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

const plugins: Plugin[] = [
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
  for (const dataType in plugin) {
    if (!Object.prototype.hasOwnProperty.call(plugin, dataType)) continue;

    validatorMap[dataType] = validatorMap[dataType] || {
      identity: (value: any) => false,
    };
    preparationMap[dataType] = preparationMap[dataType] || {};
    transformationMap[dataType] = transformationMap[dataType] || {};
    messageMap[dataType] = messageMap[dataType] || {};

    const definitions = plugin[dataType as keyof typeof plugin]!;
    for (const def of definitions) {
      if (def.prepare) {
        for (const name in def.prepare) {
          preparationMap[dataType][name] = def.prepare[name];
        }
      }
      if (def.validate) {
        for (const name in def.validate) {
          const validatorDef = def.validate[name]!;
          validatorMap[dataType][name] = validatorDef.validator;
          messageMap[dataType][name] = validatorDef.message;
        }
      }
      if (def.transform) {
        for (const name in def.transform) {
          transformationMap[dataType][name] = def.transform[name];
        }
      }
    }
  }
}
