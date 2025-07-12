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

const plugins: Plugin[] = [
  anyPlugin,
  arrayPlugin,
  bigintPlugin,
  booleanPlugin,
  datePlugin,
  instanceofPlugin,
  mapPlugin,
  nanPlugin,
  neverPlugin,
  numberPlugin,
  objectPlugin,
  setPlugin,
  stringPlugin,
  unknownPlugin,
];

function mergePlugins(plugins: Plugin[]) {
  const validatorMap: SchemaValidatorMap = {};
  const preparationMap: Record<string, any> = {};
  const transformationMap: Record<string, any> = {};
  const messageMap: Record<string, any> = {};

  for (const plugin of plugins) {
    for (const dataType in plugin) {
      if (!Object.prototype.hasOwnProperty.call(plugin, dataType)) continue;

      validatorMap[dataType] = validatorMap[dataType] || {};
      preparationMap[dataType] = preparationMap[dataType] || {};
      transformationMap[dataType] = transformationMap[dataType] || {};
      messageMap[dataType] = messageMap[dataType] || {};

      for (const config of plugin[dataType]) {
        if (config.prepare) {
          Object.assign(preparationMap[dataType], config.prepare);
        }
        if (config.transform) {
          Object.assign(transformationMap[dataType], config.transform);
        }
        if (config.validate) {
          for (const validatorName in config.validate) {
            if (
              !Object.prototype.hasOwnProperty.call(
                config.validate,
                validatorName
              )
            )
              continue;
            const definition = config.validate[validatorName];
            validatorMap[dataType][validatorName] = definition.validator;
            messageMap[dataType][validatorName] = definition.message;
          }
        }
      }
    }
  }

  return { validatorMap, preparationMap, transformationMap, messageMap };
}

export const { validatorMap, preparationMap, transformationMap, messageMap } =
  mergePlugins(plugins);
