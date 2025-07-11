import { validatorMap } from "./validator-map.js";
import {
  ValidatorFunction,
  ValidationContext,
  SchemaValidatorMap,
} from "./validators/types.js";

// A utility to force TS to expand a type in tooltips for better DX.
type Prettify<T> = { [K in keyof T]: T[K] } & {};

// Infers the argument type from a validator function's signature.
type InferConfig<Func> = Func extends (
  value: any,
  args: [infer ConfigType],
  ...rest: any[]
) => any
  ? ConfigType
  : never;

// Creates a typed config object from a validator collection.
type ValidatorConfig<VCollection> = Prettify<
  {
    [K in keyof Omit<VCollection, "identity">]?: InferConfig<VCollection[K]>;
  } & {
    optional?: boolean;
    nullable?: boolean;
    messages?: Prettify<
      {
        [K in keyof Omit<VCollection, "identity" | "messages">]?: string;
      } & {
        identity?: string;
      }
    >;
  }
>;

// Infers the base data type (e.g., string, number) from the identity validator.
type InferDataType<VCollection> = VCollection extends {
  identity: (value: any) => value is infer T;
}
  ? T
  : unknown;

function isValidationContext(thing: any): thing is ValidationContext {
  return (
    typeof thing === "object" &&
    thing !== null &&
    "rootData" in thing &&
    "path" in thing &&
    "value" in thing
  );
}

export class Schema<T> {
  private validators: Array<{
    name: string;
    validator: ValidatorFunction<T>;
    args: any[];
  }> = [];
  private dataType: string;
  public config: Record<string, unknown>;

  constructor(
    dataType: string,
    config: Record<string, unknown> = {},
    validatorMap: SchemaValidatorMap
  ) {
    this.dataType = dataType;
    this.config = config;
    const validatorCollection = validatorMap[dataType];

    if (validatorCollection?.identity) {
      this.validators.push({
        name: "identity",
        validator: validatorCollection.identity,
        args: [],
      });
    }

    for (const [validatorName, validatorConfig] of Object.entries(config)) {
      if (validatorName === "optional" || validatorName === "nullable") {
        continue;
      }
      const validator = validatorCollection?.[validatorName];
      if (validator) {
        const args =
          validatorConfig !== undefined && validatorConfig !== true
            ? [validatorConfig]
            : [];

        this.validators.push({
          name: validatorName,
          validator,
          args,
        });
      }
    }
  }

  public parse(data: T): T;
  public parse(context: ValidationContext): T;
  public parse(dataOrContext: T | ValidationContext): T {
    const context: ValidationContext = isValidationContext(dataOrContext)
      ? dataOrContext
      : {
          rootData: dataOrContext,
          path: [],
          value: dataOrContext,
        };

    return this._parse(context);
  }

  protected _parse(context: ValidationContext): T {
    if (this.config.optional && context.value === undefined) {
      return context.value;
    }
    if (this.config.nullable && context.value === null) {
      return context.value;
    }

    for (const { name, validator, args } of this.validators) {
      if (!validator(context.value, args, context)) {
        const path = context.path.join(".");
        const messages = this.config.messages as
          | { [key: string]: string }
          | undefined;
        const customMessage = messages?.[name];

        if (customMessage) {
          throw new Error(customMessage);
        }

        throw new Error(
          `Validation failed for ${this.dataType}.${name} at path '${path}'`
        );
      }
    }
    return context.value;
  }
}

class SwitchSchema<T> extends Schema<T> {
  private keyFn: (context: ValidationContext) => string | number;
  private schemas: Record<string | number, Schema<T>>;
  private defaultSchema?: Schema<T>;

  constructor(
    keyFn: (context: ValidationContext) => string | number,
    schemas: Record<string | number, Schema<T>>,
    defaultSchema?: Schema<T>
  ) {
    super("switch", {}, validatorMap as SchemaValidatorMap);
    this.keyFn = keyFn;
    this.schemas = schemas;
    this.defaultSchema = defaultSchema;
  }

  protected _parse(context: ValidationContext): T {
    const key = this.keyFn(context);
    const schema = this.schemas[key] || this.defaultSchema;

    if (schema) {
      return schema.parse(context);
    }
    return context.value;
  }
}

type CreateSchemaBuilder<TMap extends SchemaValidatorMap> = {
  [K in keyof TMap]: (
    config?: ValidatorConfig<TMap[K]>
  ) => Schema<InferDataType<TMap[K]>>;
} & {
  switch<TKey extends string | number, TSchema extends Schema<any>>(
    keyFn: (context: ValidationContext) => TKey,
    schemas: Record<TKey, TSchema>,
    defaultSchema?: TSchema
  ): TSchema;
};

function createSchemaFunction<
  TMap extends SchemaValidatorMap,
  K extends keyof TMap
>(dataType: K, validatorMap: TMap) {
  return function (config?: ValidatorConfig<TMap[K]>) {
    return new Schema<InferDataType<TMap[K]>>(
      dataType as string,
      config || {},
      validatorMap
    );
  };
}

export function createSchemaBuilder<TMap extends SchemaValidatorMap>(
  validatorMap: TMap
): CreateSchemaBuilder<TMap> {
  const builder: any = {};

  for (const dataType in validatorMap) {
    builder[dataType] = createSchemaFunction(dataType, validatorMap);
  }

  builder.switch = <TKey extends string | number, TSchema extends Schema<any>>(
    keyFn: (context: ValidationContext) => TKey,
    schemas: Record<TKey, TSchema>,
    defaultSchema?: TSchema
  ) => {
    return new SwitchSchema(keyFn, schemas, defaultSchema);
  };

  return builder;
}

export const s = createSchemaBuilder(validatorMap);
