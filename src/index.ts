import {
  validatorMap,
  preparationMap,
  transformationMap,
  messageMap,
  plugins,
} from "./validator-map.js";

import { SwitchConfig, SwitchSchema } from "./schemas/switch.js";
import {
  InferSchemaType,
  SObjectProperties,
  InferSObjectType,
} from "./types.js";

import { ValidatorConfig, Validator } from "./types.js";
import { Schema } from "./schemas/schema.js";
import { ArraySchema } from "./schemas/array.js";
import { ObjectSchema } from "./schemas/object.js";
import { SetSchema } from "./schemas/set.js";
import { UnionSchema } from "./schemas/union.js";
import { lazy } from "./utils.js";
export { SwitchSchema, Schema };

type Builder = {
  [P in Exclude<
    (typeof plugins)[number],
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
    variants: T,
    config?: ValidatorConfig<TOutput>
  ): UnionSchema<T, TOutput, TInput>;
  instanceof<T>(
    constructor: new (...args: any[]) => T,
    config?: ValidatorConfig<T>
  ): Schema<T>;
  lazy<T extends Schema<any, any>>(resolver: () => T): T;
};

function createSchemaBuilder(): Builder {
  const builder: any = {};

  for (const plugin of plugins) {
    if (plugin.dataType === "switch") continue;
    if (plugin.dataType === "array") {
      builder.array = (
        itemSchema: Schema<any, any>,
        config: Record<string, unknown> = {}
      ) => {
        return new ArraySchema(itemSchema, config);
      };
      continue;
    }
    if (plugin.dataType === "object") {
      builder.object = (config: Record<string, unknown> = {}) =>
        new ObjectSchema(config);
      continue;
    }
    if (plugin.dataType === "literal") {
      builder.literal = (value: any, config: Record<string, unknown> = {}) => {
        return new Schema("literal", {
          ...config,
          validate: { ...(config as any).validate, equals: value },
        });
      };
      continue;
    }
    if (plugin.dataType === "record") {
      builder.record = (
        keySchema: Schema<any, any>,
        valueSchema: Schema<any, any>,
        config: Record<string, unknown> = {}
      ) => {
        return new Schema("record", {
          ...config,
          validate: {
            ...(config as any).validate,
            keysAndValues: [keySchema, valueSchema],
          },
        });
      };
      continue;
    }
    if (plugin.dataType === "map") {
      builder.map = (
        keySchema: Schema<any, any>,
        valueSchema: Schema<any, any>,
        config: Record<string, unknown> = {}
      ) => {
        return new Schema("map", {
          ...config,
          validate: {
            ...(config as any).validate,
            entries: [keySchema, valueSchema],
          },
        });
      };
      continue;
    }
    if (plugin.dataType === "set") {
      builder.set = <T extends Schema<any, any>>(
        config: ValidatorConfig<any> & { validate?: { ofType?: T } } = {}
      ) => {
        const itemSchema =
          (config as any)?.validate?.ofType ?? new Schema("any");
        return new SetSchema(itemSchema, config);
      };
      continue;
    }
    if (plugin.dataType === "instanceof") {
      builder.instanceof = (
        constructor: any,
        config: Record<string, unknown> = {}
      ) => {
        return new Schema("instanceof", {
          ...config,
          validate: { ...(config as any).validate, constructor: constructor },
        });
      };
      continue;
    }
    if (plugin.dataType === "union") {
      builder.union = (
        variants: readonly Schema<any, any>[],
        config: Record<string, unknown> = {}
      ) => {
        return new UnionSchema(variants as any, config);
      };
      continue;
    }
    builder[plugin.dataType] = (config: Record<string, unknown> = {}) => {
      return new Schema(plugin.dataType, config);
    };
  }

  builder.switch = (config: SwitchConfig) => {
    return new SwitchSchema(config);
  };

  builder.lazy = lazy;

  return builder as Builder;
}

export const s = createSchemaBuilder();

export namespace s {
  export type infer<T extends Schema<any, any>> = T extends Schema<infer U, any>
    ? U
    : never;
}
