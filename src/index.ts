import {
  baseValidatorMap,
  basePreparationMap,
  baseTransformationMap,
  baseMessageMap,
  basePlugins,
} from "./validator-map.js";

import { SwitchConfig, SwitchSchema } from "./schemas/switch.js";
import {
  InferSchemaType,
  SObjectProperties,
  InferSObjectType,
  Validator,
  Plugin,
} from "./types.js";

import { ValidatorConfig } from "./types.js";
import { Schema } from "./schemas/schema.js";
import { ArraySchema } from "./schemas/array.js";
import { ObjectSchema } from "./schemas/object.js";
import { SetSchema } from "./schemas/set.js";
import { UnionSchema, UnionValidatorConfig } from "./schemas/union.js";
import { lazy } from "./validators/lazy.js";
export { SwitchSchema, Schema };

export * from "./types.js";

type Builder = {
  [P in Exclude<
    (typeof basePlugins)[number],
    {
      dataType:
        | "switch"
        | "object"
        | "literal"
        | "array"
        | "record"
        | "map"
        | "set"
        | "union"
        | "instanceof";
    }
  > as P["dataType"]]: (
    config?: ValidatorConfig<
      P extends Validator<infer TOutput, any> ? TOutput : never
    >
  ) => Schema<
    P extends Validator<infer TOutput, any> ? TOutput : never,
    P extends Validator<any, infer TInput> ? TInput : never
  >;
} & {
  array<
    T extends Schema<any, any>,
    TOutput = InferSchemaType<T>[],
    TInput = InferSchemaType<T>[]
  >(
    itemSchema: T,
    config?: ValidatorConfig<TOutput>
  ): ArraySchema<T, TOutput, TInput>;
  object<P extends SObjectProperties, T = InferSObjectType<P>>(
    config: ValidatorConfig<T> & { validate?: { properties?: P } }
  ): ObjectSchema<P, T>;
  switch<TOutput, TInput = TOutput>(
    config: SwitchConfig
  ): Schema<TOutput, TInput>;
  literal<T extends string | number | boolean | null | undefined>(
    value: T,
    config?: ValidatorConfig<T>
  ): Schema<T>;
  record<
    K extends Schema<any, any>,
    V extends Schema<any, any>,
    TOutput = Record<InferSchemaType<K>, InferSchemaType<V>>,
    TInput = Record<InferSchemaType<K>, InferSchemaType<V>>
  >(
    keySchema: K,
    valueSchema: V,
    config?: ValidatorConfig<TOutput>
  ): Schema<TOutput, TInput>;
  map<
    K extends Schema<any, any>,
    V extends Schema<any, any>,
    TOutput = Map<InferSchemaType<K>, InferSchemaType<V>>,
    TInput = Map<InferSchemaType<K>, InferSchemaType<V>>
  >(
    keySchema: K,
    valueSchema: V,
    config?: ValidatorConfig<TOutput>
  ): Schema<TOutput, TInput>;
  set<
    T extends Schema<any, any>,
    TOutput = Set<InferSchemaType<T>>,
    TInput = Set<InferSchemaType<T>>
  >(
    config?: ValidatorConfig<TOutput> & { validate?: { ofType?: T } }
  ): SetSchema<T, TOutput, TInput>;
  union<
    T extends readonly [Schema<any, any>, ...Schema<any, any>[]],
    TOutput = InferSchemaType<T[number]>,
    TInput = InferSchemaType<T[number]>
  >(
    config: UnionValidatorConfig<T, TOutput>
  ): UnionSchema<T, TOutput, TInput>;
  instanceof<T>(
    constructor: new (...args: any[]) => T,
    config?: ValidatorConfig<T>
  ): Schema<T>;
  lazy<T extends Schema<any, any>>(resolver: () => T): T;
};

function createSchemaBuilder(maps: {
  validatorMap: any;
  preparationMap: any;
  transformationMap: any;
  messageMap: any;
}): Builder {
  const builder: any = {};

  for (const plugin of basePlugins) {
    if (plugin.dataType === "switch") continue;
    if (plugin.dataType === "array") {
      builder.array = (
        itemSchema: Schema<any, any>,
        config: Record<string, unknown> = {}
      ) => {
        return new ArraySchema(itemSchema, config, maps);
      };
      continue;
    }
    if (plugin.dataType === "object") {
      builder.object = (config: Record<string, unknown> = {}) =>
        new ObjectSchema(config, maps);
      continue;
    }
    if (plugin.dataType === "literal") {
      builder.literal = (value: any, config: Record<string, unknown> = {}) => {
        return new Schema(
          "literal",
          {
            ...config,
            validate: { ...(config as any).validate, equals: value },
          },
          maps
        );
      };
      continue;
    }
    if (plugin.dataType === "record") {
      builder.record = (
        keySchema: Schema<any, any>,
        valueSchema: Schema<any, any>,
        config: Record<string, unknown> = {}
      ) => {
        return new Schema(
          "record",
          {
            ...config,
            validate: {
              ...(config as any).validate,
              keysAndValues: [keySchema, valueSchema],
            },
          },
          maps
        );
      };
      continue;
    }
    if (plugin.dataType === "map") {
      builder.map = (
        keySchema: Schema<any, any>,
        valueSchema: Schema<any, any>,
        config: Record<string, unknown> = {}
      ) => {
        return new Schema(
          "map",
          {
            ...config,
            validate: {
              ...(config as any).validate,
              entries: [keySchema, valueSchema],
            },
          },
          maps
        );
      };
      continue;
    }
    if (plugin.dataType === "set") {
      builder.set = <T extends Schema<any, any>>(
        config: ValidatorConfig<any> & { validate?: { ofType?: T } } = {}
      ) => {
        const itemSchema =
          (config as any)?.validate?.ofType ?? new Schema("any", {}, maps);
        return new SetSchema(itemSchema, config, maps);
      };
      continue;
    }
    if (plugin.dataType === "instanceof") {
      builder.instanceof = (
        constructor: any,
        config: Record<string, unknown> = {}
      ) => {
        return new Schema(
          "instanceof",
          {
            ...config,
            validate: { ...(config as any).validate, identity: constructor },
          },
          maps
        );
      };
      continue;
    }
    if (plugin.dataType === "union") {
      builder.union = (config: Record<string, unknown> = {}) => {
        return new UnionSchema(config as any, maps);
      };
      continue;
    }
    builder[plugin.dataType] = (config: Record<string, unknown> = {}) => {
      return new Schema(plugin.dataType, config, maps);
    };
  }

  builder.switch = (config: SwitchConfig) => {
    return new SwitchSchema(config, maps);
  };

  builder.lazy = lazy;

  return builder as Builder;
}

function deepCloneWithFuncs(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (typeof obj === "function") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepCloneWithFuncs);
  }

  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = deepCloneWithFuncs(obj[key]);
    }
  }
  return newObj;
}

export function createSValidator(plugins: Plugin<any, any>[] = []) {
  const finalValidatorMap = deepCloneWithFuncs(baseValidatorMap);
  const finalPreparationMap = deepCloneWithFuncs(basePreparationMap);
  const finalTransformationMap = deepCloneWithFuncs(baseTransformationMap);
  const finalMessageMap = deepCloneWithFuncs(baseMessageMap);

  for (const plugin of plugins) {
    const dataType = plugin.dataType;
    finalValidatorMap[dataType] = finalValidatorMap[dataType] || {
      identity: (value: any) => false,
    };
    finalPreparationMap[dataType] = finalPreparationMap[dataType] || {};
    finalTransformationMap[dataType] = finalTransformationMap[dataType] || {};
    finalMessageMap[dataType] = finalMessageMap[dataType] || {};

    if (plugin.prepare) {
      for (const name in plugin.prepare) {
        finalPreparationMap[dataType][name] = plugin.prepare[name];
      }
    }
    if (plugin.validate) {
      for (const name in plugin.validate) {
        const validatorDef = plugin.validate[name]!;
        finalValidatorMap[dataType][name] = validatorDef.validator;
        finalMessageMap[dataType][name] = validatorDef.message;
      }
    }
    if (plugin.transform) {
      for (const name in plugin.transform) {
        finalTransformationMap[dataType][name] = plugin.transform[name];
      }
    }
  }

  return createSchemaBuilder({
    validatorMap: finalValidatorMap,
    preparationMap: finalPreparationMap,
    transformationMap: finalTransformationMap,
    messageMap: finalMessageMap,
  });
}

export const s = createSValidator();

export namespace s {
  export type infer<T extends Schema<any, any>> = T extends Schema<infer U, any>
    ? U
    : never;
}
