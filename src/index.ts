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
export { SwitchSchema };

type Builder = {
  [P in Exclude<
    (typeof plugins)[number],
    { dataType: "switch" | "object" | "literal" }
  > as P["dataType"]]: (
    config?: ValidatorConfig<any>
  ) => Schema<
    P extends Validator<infer TOutput, any> ? TOutput : never,
    P extends Validator<any, infer TInput> ? TInput : never
  >;
} & {
  array<T extends Schema<any, any>>(
    itemSchema: T,
    config?: ValidatorConfig<any>
  ): ArraySchema<T, InferSchemaType<T>[]>;
  array(config?: ValidatorConfig<any>): ArraySchema<Schema<any, any>, any[]>;
  object<P extends SObjectProperties>(
    config: ValidatorConfig<any> & { validate?: { properties?: P } }
  ): ObjectSchema<P, InferSObjectType<P>>;
  switch(config: SwitchConfig): Schema<any>;
  literal(value: string | number | boolean | null | undefined): Schema<any>;
  record(
    keySchema: Schema<any, any>,
    valueSchema: Schema<any, any>
  ): Schema<Record<any, any>>;
  map(
    keySchema: Schema<any, any>,
    valueSchema: Schema<any, any>
  ): Schema<Map<any, any>>;
  set(itemSchema: Schema<any, any>): Schema<Set<any>>;
  instanceof(constructor: new (...args: any[]) => any): Schema<any>;
};

function createSchemaBuilder(): Builder {
  const builder: any = {};

  for (const plugin of plugins) {
    if (plugin.dataType === "switch") continue;
    if (plugin.dataType === "array") {
      builder.array = <T extends Schema<any, any>>(
        itemSchemaOrConfig?: T | ValidatorConfig<any>,
        config: ValidatorConfig<any> = {}
      ) => {
        if (itemSchemaOrConfig instanceof Schema) {
          return new ArraySchema(itemSchemaOrConfig, config);
        }

        const configObj = itemSchemaOrConfig ?? {};
        const itemSchema =
          (configObj as any)?.validate?.ofType ?? new Schema("any");
        return new ArraySchema(itemSchema, configObj);
      };
      continue;
    }
    if (plugin.dataType === "object") {
      builder.object = <P extends SObjectProperties>(
        config: ValidatorConfig<any> & { validate?: { properties?: P } }
      ) => new ObjectSchema<P, InferSObjectType<P>>(config);
      continue;
    }
    if (plugin.dataType === "literal") {
      builder.literal = (value: any) => {
        return new Schema("literal", { validate: { equals: value } });
      };
      continue;
    }
    if (plugin.dataType === "record") {
      builder.record = (
        keySchema: Schema<any, any>,
        valueSchema: Schema<any, any>
      ) => {
        return new Schema("record", {
          validate: { keysAndValues: [keySchema, valueSchema] },
        });
      };
      continue;
    }
    if (plugin.dataType === "map") {
      builder.map = (
        keySchema: Schema<any, any>,
        valueSchema: Schema<any, any>
      ) => {
        return new Schema("map", {
          validate: { entries: [keySchema, valueSchema] },
        });
      };
      continue;
    }
    if (plugin.dataType === "set") {
      builder.set = (itemSchema: Schema<any, any>) => {
        return new Schema("set", {
          validate: { items: itemSchema },
        });
      };
      continue;
    }
    if (plugin.dataType === "instanceof") {
      builder.instanceof = (constructor: any) => {
        return new Schema("instanceof", {
          validate: { constructor: constructor },
        });
      };
      continue;
    }
    builder[plugin.dataType] = (config?: ValidatorConfig<any>) => {
      return new Schema(plugin.dataType, config);
    };
  }

  builder.switch = (config: SwitchConfig) => {
    return new SwitchSchema(config);
  };

  return builder as Builder;
}

export const s = createSchemaBuilder();

export namespace s {
  export type infer<T extends Schema<any, any>> = T extends Schema<infer U, any>
    ? U
    : never;
}
