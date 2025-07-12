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
        context
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
      const result = await validator(context.value, args, context);
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

  return builder;
}

export const s = createSchemaBuilder(validatorMap);
