import { validatorMap } from "./validator-map.js";
import { StandardSchemaV1 } from "./standard-schema.js";
import {
  ValidatorFunction,
  ValidationContext,
  SchemaValidatorMap,
  ValidationIssue,
  ValidationError,
  SafeParseResult,
  SafeParseError,
  SafeParseSuccess,
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
  : unknown;

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

type InferSchemaType<T extends Schema<any>> = T extends Schema<infer U>
  ? U
  : never;

function isValidationContext(thing: any): thing is ValidationContext {
  return (
    typeof thing === "object" &&
    thing !== null &&
    "rootData" in thing &&
    "path" in thing &&
    "value" in thing
  );
}

export class Schema<T> implements StandardSchemaV1<T, T> {
  private validators: Array<{
    name: string;
    validator: ValidatorFunction<T>;
    args: any[];
  }> = [];
  private dataType: string;
  public config: Record<string, unknown>;
  public readonly "~standard": StandardSchemaV1.Props<T, T>;

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
        const args = [validatorConfig];

        this.validators.push({
          name: validatorName,
          validator,
          args,
        });
      }
    }

    this["~standard"] = {
      version: 1,
      vendor: "s-val",
      validate: async (value: unknown): Promise<StandardSchemaV1.Result<T>> => {
        const result = await this.safeParse(value as T);
        if (result.status === "success") {
          return { value: result.data };
        }
        const issues: StandardSchemaV1.Issue[] = result.error.issues.map(
          (issue) => ({
            message: issue.message,
            path: issue.path.map((key) => ({ key })),
          })
        );
        return { issues };
      },
      types: {} as StandardSchemaV1.Types<T, T>,
    };
  }

  public async parse(data: T): Promise<T>;
  public async parse(context: ValidationContext): Promise<T>;
  public async parse(dataOrContext: T | ValidationContext): Promise<T> {
    const context: ValidationContext = isValidationContext(dataOrContext)
      ? dataOrContext
      : {
          rootData: dataOrContext,
          path: [],
          value: dataOrContext,
        };

    return this._parse(context);
  }

  public async safeParse(data: T): Promise<SafeParseResult<T>>;
  public async safeParse(
    context: ValidationContext
  ): Promise<SafeParseResult<T>>;
  public async safeParse(
    dataOrContext: T | ValidationContext
  ): Promise<SafeParseResult<T>> {
    const context: ValidationContext = isValidationContext(dataOrContext)
      ? dataOrContext
      : {
          rootData: dataOrContext,
          path: [],
          value: dataOrContext,
        };
    try {
      const data = await this._parse(context);
      return { status: "success", data };
    } catch (e) {
      if (e instanceof ValidationError) {
        return { status: "error", error: e };
      }
      throw e;
    }
  }

  protected async _parse(context: ValidationContext): Promise<T> {
    if (this.config.optional && context.value === undefined) {
      return context.value;
    }
    if (this.config.nullable && context.value === null) {
      return context.value;
    }

    const issues: ValidationIssue[] = [];

    const identityValidator = this.validators.find(
      (v) => v.name === "identity"
    );
    if (identityValidator) {
      const result = await identityValidator.validator(
        context.value,
        identityValidator.args,
        context,
        this
      );
      if (!result) {
        const path = context.path.join(".");
        const messages = this.config.messages as
          | { [key: string]: string }
          | undefined;
        let message = messages?.identity;

        if (!message) {
          message = `Invalid type. Expected ${
            this.dataType
          }, received ${typeof context.value}. Path: '${path}'`;
        }
        issues.push({
          path: context.path,
          message,
        });
        throw new ValidationError(issues); // Throw immediately
      }
    }

    for (const { name, validator, args } of this.validators) {
      if (name === "identity") continue;
      const result = await validator(context.value, args, context, this);
      if (!result) {
        const path = context.path.join(".");
        const messages = this.config.messages as
          | { [key: string]: string }
          | undefined;
        let message = messages?.[name];

        if (!message) {
          if (name === "identity") {
            message = `Invalid type. Expected ${
              this.dataType
            }, received ${typeof context.value}. Path: '${path}'`;
          } else {
            message = `Validation failed for ${this.dataType}.${name} at path '${path}'`;
          }
        }

        issues.push({
          path: context.path,
          message,
        });
      }
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    return context.value;
  }

  public partial(): Schema<Partial<T>> {
    if (this.dataType !== "object" || !this.config.properties) {
      return this as any; // Or throw an error
    }

    const originalProperties = this.config.properties as Record<
      string,
      Schema<any>
    >;
    const newProperties: Record<string, Schema<any>> = {};

    for (const key in originalProperties) {
      newProperties[key] = originalProperties[key].optional();
    }

    const newConfig = { ...this.config, properties: newProperties };

    return new Schema(this.dataType, newConfig, validatorMap);
  }

  public pick<K extends keyof T>(keys: K[]): Schema<Pick<T, K>> {
    if (this.dataType !== "object" || !this.config.properties) {
      // In a real-world scenario, you might want to throw an error
      // or handle this more gracefully. For now, we'll return `this`
      // which is not ideal but prevents a runtime crash.
      return this as any;
    }

    const originalProperties = this.config.properties as Record<
      string,
      Schema<any>
    >;
    const newProperties: Record<string, Schema<any>> = {};

    for (const key of keys) {
      if (originalProperties[key as string]) {
        newProperties[key as string] = originalProperties[key as string];
      }
    }

    const newConfig = {
      ...this.config,
      properties: newProperties,
      strict: true,
    };
    return new Schema(this.dataType, newConfig, validatorMap);
  }

  public optional(): Schema<T | undefined> {
    return new Schema(
      this.dataType,
      { ...this.config, optional: true },
      validatorMap
    );
  }

  public nullable(): Schema<T | null> {
    return new Schema(
      this.dataType,
      { ...this.config, nullable: true },
      validatorMap
    );
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

  protected async _parse(context: ValidationContext): Promise<T> {
    const key = this.keyFn(context);
    const schema = this.schemas[key] || this.defaultSchema;

    if (schema) {
      return schema.parse(context);
    }
    return context.value;
  }
}

class MapSchema<K extends Schema<any>, V extends Schema<any>> extends Schema<
  Map<InferSchemaType<K>, InferSchemaType<V>>
> {
  private keySchema: K;
  private valueSchema: V;

  constructor(keySchema: K, valueSchema: V) {
    super("map", {}, validatorMap as SchemaValidatorMap);
    this.keySchema = keySchema;
    this.valueSchema = valueSchema;
  }

  protected async _parse(
    context: ValidationContext
  ): Promise<Map<InferSchemaType<K>, InferSchemaType<V>>> {
    if (!(context.value instanceof Map)) {
      throw new ValidationError([
        { path: context.path, message: "Invalid type. Expected a Map." },
      ]);
    }

    const newMap = new Map();
    for (const [key, value] of context.value.entries()) {
      const keyResult = await this.keySchema.safeParse({
        ...context,
        path: [...context.path, key, "key"],
        value: key,
      });
      if (keyResult.status === "error") {
        throw keyResult.error;
      }

      const valueResult = await this.valueSchema.safeParse({
        ...context,
        path: [...context.path, key, "value"],
        value: value,
      });
      if (valueResult.status === "error") {
        throw valueResult.error;
      }
      newMap.set(keyResult.data, valueResult.data);
    }
    return newMap;
  }
}

class SetSchema<V extends Schema<any>> extends Schema<Set<InferSchemaType<V>>> {
  private valueSchema: V;

  constructor(valueSchema: V) {
    super("set", {}, validatorMap as SchemaValidatorMap);
    this.valueSchema = valueSchema;
  }

  protected async _parse(
    context: ValidationContext
  ): Promise<Set<InferSchemaType<V>>> {
    if (!(context.value instanceof Set)) {
      throw new ValidationError([
        { path: context.path, message: "Invalid type. Expected a Set." },
      ]);
    }

    const newSet = new Set<InferSchemaType<V>>();
    for (const value of context.value.values()) {
      const valueResult = await this.valueSchema.safeParse({
        ...context,
        path: [...context.path, value],
        value: value,
      });
      if (valueResult.status === "error") {
        throw valueResult.error;
      }
      newSet.add(valueResult.data);
    }
    return newSet;
  }
}

class InstanceOfSchema<T extends new (...args: any) => any> extends Schema<
  InstanceType<T>
> {
  private constructorFn: T;

  constructor(constructorFn: T) {
    super("instanceof", {}, validatorMap as SchemaValidatorMap);
    this.constructorFn = constructorFn;
  }

  protected async _parse(context: ValidationContext): Promise<InstanceType<T>> {
    if (context.value instanceof this.constructorFn) {
      return context.value;
    }
    throw new ValidationError([
      {
        path: context.path,
        message: `Invalid type. Expected instanceof ${this.constructorFn.name}.`,
      },
    ]);
  }
}

class LiteralSchema<
  T extends string | number | boolean | null | undefined
> extends Schema<T> {
  private literal: T;

  constructor(literal: T) {
    super("literal", {}, validatorMap as SchemaValidatorMap);
    this.literal = literal;
  }

  protected async _parse(context: ValidationContext): Promise<T> {
    if (context.value === this.literal) {
      return context.value as T;
    }
    throw new ValidationError([
      {
        path: context.path,
        message: `Invalid literal value. Expected ${this.literal}, received ${context.value}`,
      },
    ]);
  }
}

class UnionSchema<T extends [Schema<any>, ...Schema<any>[]]> extends Schema<
  InferSchemaType<T[number]>
> {
  private schemas: T;

  constructor(schemas: T) {
    super("union", {}, validatorMap as SchemaValidatorMap);
    this.schemas = schemas;
  }

  protected async _parse(
    context: ValidationContext
  ): Promise<InferSchemaType<T[number]>> {
    const issues: ValidationIssue[] = [];
    for (const schema of this.schemas) {
      try {
        // Since .parse() is now async, we must await it.
        return await schema.parse(context);
      } catch (e) {
        if (e instanceof ValidationError) {
          issues.push(...e.issues);
        } else {
          throw e;
        }
      }
    }
    throw new ValidationError(issues);
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
  union<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T): UnionSchema<T>;
  literal<T extends string | number | boolean | null | undefined>(
    literal: T
  ): LiteralSchema<T>;
  map<K extends Schema<any>, V extends Schema<any>>(
    keySchema: K,
    valueSchema: V
  ): MapSchema<K, V>;
  set<V extends Schema<any>>(valueSchema: V): SetSchema<V>;
  instanceof<T extends new (...args: any) => any>(
    constructorFn: T
  ): InstanceOfSchema<T>;
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

  builder.union = <T extends [Schema<any>, ...Schema<any>[]]>(schemas: T) => {
    return new UnionSchema(schemas);
  };

  builder.literal = <T extends string | number | boolean | null | undefined>(
    literal: T
  ) => {
    return new LiteralSchema(literal);
  };

  builder.map = <K extends Schema<any>, V extends Schema<any>>(
    keySchema: K,
    valueSchema: V
  ) => {
    return new MapSchema(keySchema, valueSchema);
  };

  builder.set = <V extends Schema<any>>(valueSchema: V) => {
    return new SetSchema(valueSchema);
  };

  builder.instanceof = <T extends new (...args: any) => any>(
    constructorFn: T
  ) => {
    return new InstanceOfSchema(constructorFn);
  };

  return builder;
}

export const s = createSchemaBuilder(validatorMap);

export namespace s {
  export type infer<T extends Schema<any>> = T extends Schema<infer U>
    ? U
    : never;
}
