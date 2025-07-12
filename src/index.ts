import {
  validatorMap,
  preparationMap,
  transformationMap,
} from "./validator-map.js";
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
  PreparationFunction,
  TransformationFunction,
} from "./validators/types.js";

// A utility to force TS to expand a type in tooltips for better DX.
type Prettify<T> = { [K in keyof T]: T[K] } & {};

// The keys of T that can be undefined
type UndefinedKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];

// Make properties of T optional if their value can be undefined
type UndefinedToOptional<T> = Prettify<
  { [K in Exclude<keyof T, UndefinedKeys<T>>]: T[K] } & {
    [K in UndefinedKeys<T>]?: T[K];
  }
>;

// Infers the argument type from a validator function's signature.
type InferConfig<Func> = Func extends (
  value: any,
  args: [infer ConfigType],
  ...rest: any[]
) => any
  ? ConfigType
  : unknown;

type CustomValidator<T> =
  | ((value: T, context: ValidationContext) => boolean | Promise<boolean>)
  | {
      validator: (
        value: T,
        context: ValidationContext
      ) => boolean | Promise<boolean>;
      message?: string;
    };

// Creates a typed config object from a validator collection.
type ValidatorConfig<VCollection> = {
  optional?: boolean;
  nullable?: boolean;
  messages?: Prettify<
    {
      [K in keyof Omit<
        VCollection,
        "identity" | "messages" | "preparations" | "transformations"
      >]?: string;
    } & {
      identity?: string;
    }
  >;
  prepare?: Record<string, any> & { custom?: ((value: any) => any)[] };
  validate?: Record<string, any> & {
    custom?: CustomValidator<any> | CustomValidator<any>[];
  };
  transform?: Record<string, any> & { custom?: ((value: any) => any)[] };
};

// Infers the base data type (e.g., string, number) from the identity validator.
type InferDataType<VCollection> = VCollection extends {
  identity: (value: any) => value is infer T;
}
  ? T
  : unknown;

type InferSchemaType<T extends Schema<any, any>> = T extends Schema<
  infer U,
  any
>
  ? U
  : never;

type SObjectProperties = Record<string, Schema<any, any>>;
type InferSObjectType<P extends SObjectProperties> = Prettify<
  UndefinedToOptional<{
    [K in keyof P]: InferSchemaType<P[K]>;
  }>
>;

// Add an index signature to allow for extra properties
type WithLoose<T> = T & { [key: string]: any };

type SObjectOptions<P extends SObjectProperties> = ValidatorConfig<any> & {
  properties: P;
  strict?: boolean;
};

function isValidationContext(thing: any): thing is ValidationContext {
  return (
    typeof thing === "object" &&
    thing !== null &&
    "rootData" in thing &&
    "path" in thing &&
    "value" in thing
  );
}

export class Schema<TOutput, TInput = TOutput>
  implements StandardSchemaV1<TInput, TOutput>
{
  protected validators: Array<{
    name: string;
    validator: ValidatorFunction<TOutput>;
    args: any[];
  }> = [];
  protected preparations: Array<{
    name: string;
    preparation: PreparationFunction;
    args: any[];
  }> = [];
  protected customPreparations: PreparationFunction[] = [];
  protected transformations: Array<{
    name: string;
    transformation: TransformationFunction;
    args: any[];
  }> = [];
  protected customTransformations: TransformationFunction[] = [];
  protected customValidators: CustomValidator<TOutput>[] = [];
  private dataType: string;
  public config: Record<string, unknown>;
  public readonly "~standard": StandardSchemaV1.Props<TInput, TOutput>;

  constructor(
    dataType: string,
    config: Record<string, unknown> = {},
    validatorMap: SchemaValidatorMap,
    preparationMap: Record<string, any>,
    transformationMap: Record<string, any>
  ) {
    this.dataType = dataType;
    this.config = config;
    const validatorCollection = validatorMap[dataType];
    const preparationCollection = preparationMap[dataType];
    const transformationCollection = transformationMap[dataType];
    const { prepare, validate, transform } = config as ValidatorConfig<any>;

    if (validatorCollection?.identity) {
      this.validators.push({
        name: "identity",
        validator: validatorCollection.identity,
        args: [],
      });
    }

    if (prepare) {
      for (const [prepName, prepConfig] of Object.entries(prepare)) {
        if (prepName === "custom") {
          this.customPreparations = prepConfig;
          continue;
        }
        if (preparationCollection?.[prepName]) {
          this.preparations.push({
            name: prepName,
            preparation: preparationCollection[prepName],
            args: [prepConfig],
          });
        }
      }
    }

    if (validate) {
      for (let [valName, valConfig] of Object.entries(validate)) {
        if (valName === "custom") {
          this.customValidators = Array.isArray(valConfig)
            ? valConfig
            : [valConfig];
          continue;
        }
        if (valConfig === undefined) {
          valConfig = true;
        }
        if (validatorCollection?.[valName]) {
          this.validators.push({
            name: valName,
            validator: validatorCollection[valName],
            args: [valConfig],
          });
        }
      }
    }

    if (transform) {
      for (const [transName, transConfig] of Object.entries(transform)) {
        if (transName === "custom") {
          this.customTransformations = transConfig;
          continue;
        }
        if (transformationCollection?.[transName]) {
          this.transformations.push({
            name: transName,
            transformation: transformationCollection[transName],
            args: [transConfig],
          });
        }
      }
    }

    this["~standard"] = {
      version: 1,
      vendor: "s-val",
      validate: async (
        value: unknown
      ): Promise<StandardSchemaV1.Result<TOutput>> => {
        const result = await this.safeParse(value as TInput);
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
      types: {} as StandardSchemaV1.Types<TInput, TOutput>,
    };
  }

  public async parse(data: TInput): Promise<TOutput>;
  public async parse(context: ValidationContext): Promise<TOutput>;
  public async parse(
    dataOrContext: TInput | ValidationContext
  ): Promise<TOutput> {
    const context: ValidationContext = isValidationContext(dataOrContext)
      ? dataOrContext
      : {
          rootData: dataOrContext,
          path: [],
          value: dataOrContext,
        };

    return this._parse(context);
  }

  public async safeParse(data: TInput): Promise<SafeParseResult<TOutput>>;
  public async safeParse(
    context: ValidationContext
  ): Promise<SafeParseResult<TOutput>>;
  public async safeParse(
    dataOrContext: TInput | ValidationContext
  ): Promise<SafeParseResult<TOutput>> {
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

  public async _parse(context: ValidationContext): Promise<TOutput> {
    // Run preparations
    let current_value: any = context.value;
    for (const { preparation, args } of this.preparations) {
      current_value = await preparation(
        current_value,
        args,
        { ...context, value: current_value },
        this
      );
    }
    for (const customPreparation of this.customPreparations) {
      current_value = await customPreparation(
        current_value,
        [],
        { ...context, value: current_value },
        this
      );
    }

    // Optional/nullable checks
    if (this.config.optional && current_value === undefined) {
      return undefined as TOutput;
    }
    if (this.config.nullable && current_value === null) {
      return null as TOutput;
    }

    const issues: ValidationIssue[] = [];
    const messages = (this.config as ValidatorConfig<any>).messages ?? {};

    // Identity validation first
    const identityValidator = this.validators.find(
      (v) => v.name === "identity"
    );
    if (
      identityValidator &&
      !(await identityValidator.validator(
        current_value,
        identityValidator.args,
        context,
        this
      ))
    ) {
      issues.push({
        path: context.path,
        message:
          messages.identity ??
          `Invalid type. Expected ${
            this.dataType
          }, received ${typeof current_value}.`,
      });
      // If identity fails, no point in running other validators
      throw new ValidationError(issues);
    }

    // Other validations
    for (const { name, validator, args } of this.validators) {
      if (name === "identity") continue;
      if (!(await validator(current_value, args, context, this))) {
        issues.push({
          path: context.path,
          message:
            messages[name] ?? `Validation failed for ${this.dataType}.${name}`,
        });
      }
    }

    // Custom validations
    for (const customValidator of this.customValidators) {
      const result =
        typeof customValidator === "function"
          ? await customValidator(current_value, {
              ...context,
              value: current_value,
            })
          : await customValidator.validator(current_value, {
              ...context,
              value: current_value,
            });

      if (!result) {
        const message =
          typeof customValidator === "function"
            ? `Custom validation failed for ${this.dataType}`
            : customValidator.message ??
              `Custom validation failed for ${this.dataType}`;
        issues.push({ path: context.path, message });
      }
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    // Run transformations
    for (const { transformation, args } of this.transformations) {
      current_value = await transformation(
        current_value,
        args,
        { ...context, value: current_value },
        this
      );
    }
    for (const customTransformation of this.customTransformations) {
      current_value = await customTransformation(
        current_value,
        [],
        { ...context, value: current_value },
        this
      );
    }

    return current_value;
  }

  public optional(): Schema<TOutput | undefined, TInput | undefined> {
    return new Schema(
      this.dataType,
      { ...this.config, optional: true },
      validatorMap,
      preparationMap,
      transformationMap
    );
  }

  public nullable(): Schema<TOutput | null, TInput | null> {
    return new Schema(
      this.dataType,
      { ...this.config, nullable: true },
      validatorMap,
      preparationMap,
      transformationMap
    );
  }
}

class ObjectSchema<
  P extends SObjectProperties,
  T = InferSObjectType<P>
> extends Schema<T> {
  constructor(config: SObjectOptions<P>) {
    super("object", config, validatorMap, preparationMap, transformationMap);
  }

  public async _parse(context: ValidationContext): Promise<T> {
    // Run preparations on the object itself.
    let current_value: any = context.value;
    for (const { preparation, args } of this.preparations) {
      current_value = await preparation(
        current_value,
        args,
        { ...context, value: current_value },
        this
      );
    }
    for (const customPreparation of this.customPreparations) {
      current_value = await customPreparation(
        current_value,
        [],
        { ...context, value: current_value },
        this
      );
    }

    // Optional/nullable checks
    if (this.config.optional && current_value === undefined) {
      return undefined as T;
    }
    if (this.config.nullable && current_value === null) {
      return null as T;
    }

    // Identity check
    if (
      typeof current_value !== "object" ||
      current_value === null ||
      Array.isArray(current_value)
    ) {
      throw new ValidationError([
        {
          path: context.path,
          message: `Invalid type. Expected object, received ${typeof current_value}.`,
        },
      ]);
    }

    // Property-level parsing
    const properties = (this.config as SObjectOptions<P>).properties;
    const isStrict = (this.config as SObjectOptions<P>).strict;
    const newObject: Record<string, any> = {};
    const issues: ValidationIssue[] = [];

    const allKeys = new Set([
      ...Object.keys(current_value),
      ...Object.keys(properties),
    ]);

    for (const key of allKeys) {
      const schema = properties[key];
      const valueExists = Object.prototype.hasOwnProperty.call(
        current_value,
        key
      );

      if (schema) {
        try {
          const parsedValue = await (schema as any).parse({
            ...context,
            path: [...context.path, key],
            value: current_value[key],
          });
          if (
            parsedValue === undefined &&
            !(schema.config as any).optional &&
            !Object.prototype.hasOwnProperty.call(current_value, key)
          ) {
            issues.push({
              path: [...context.path, key],
              message: "Required property is missing",
            });
            continue;
          }

          if (parsedValue !== undefined) {
            newObject[key] = parsedValue;
          }
        } catch (e) {
          if (e instanceof ValidationError) {
            issues.push(...e.issues);
          } else {
            throw e;
          }
        }
      } else if (valueExists) {
        if (isStrict) {
          issues.push({
            path: [...context.path, key],
            message: `Unrecognized key: '${key}'`,
          });
        } else {
          newObject[key] = current_value[key];
        }
      }
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    let finalValue = newObject;

    // Object-level custom validation
    for (const customValidator of this.customValidators) {
      const result =
        typeof customValidator === "function"
          ? await customValidator(finalValue as any, {
              ...context,
              value: finalValue as any,
            })
          : await customValidator.validator(finalValue as any, {
              ...context,
              value: finalValue as any,
            });
      if (!result) {
        const message =
          typeof customValidator === "object"
            ? customValidator.message
            : "Custom validation failed";
        issues.push({
          path: context.path,
          message: message || "Custom validation failed",
        });
      }
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    // Object-level transformations
    for (const { transformation, args } of this.transformations) {
      finalValue = await transformation(
        finalValue,
        args,
        { ...context, value: finalValue as any },
        this
      );
    }
    for (const customTransformation of this.customTransformations) {
      finalValue = await customTransformation(
        finalValue,
        [],
        { ...context, value: finalValue as any },
        this
      );
    }

    return finalValue as T;
  }

  public partial(): ObjectSchema<P> {
    const originalProperties = this.config.properties as P;
    const newProperties: P = {} as any;

    for (const key in originalProperties) {
      newProperties[key] = originalProperties[key].optional() as any;
    }

    const newConfig: SObjectOptions<P> = {
      ...this.config,
      properties: newProperties,
    };
    return new ObjectSchema(newConfig);
  }

  public pick<K extends keyof P>(keys: K[]): ObjectSchema<Pick<P, K>> {
    const originalProperties = this.config.properties as P;
    const newProperties = {} as Pick<P, K>;

    for (const key of keys) {
      if (key in originalProperties) {
        newProperties[key] = originalProperties[key];
      }
    }

    const newConfig = {
      ...this.config,
      properties: newProperties,
      strict: true,
    };
    return new ObjectSchema(newConfig);
  }

  public omit<K extends keyof P>(keys: K[]): ObjectSchema<Omit<P, K>> {
    const originalProperties = this.config.properties as P;
    const newProperties = { ...originalProperties };

    for (const key of keys) {
      delete newProperties[key];
    }

    const newConfig = {
      ...this.config,
      properties: newProperties,
      strict: true,
    };
    return new ObjectSchema(newConfig);
  }

  public extend<P2 extends SObjectProperties>(
    extension: P2
  ): ObjectSchema<P & P2> {
    const originalProperties = this.config.properties as P;

    const newConfig = {
      ...this.config,
      properties: {
        ...originalProperties,
        ...extension,
      },
      strict: false,
    };
    return new ObjectSchema(newConfig);
  }

  public strict(): ObjectSchema<P, T> {
    const newConfig = {
      ...this.config,
      strict: true,
      properties: this.config.properties as P,
    };
    return new ObjectSchema(newConfig);
  }
}

class ArraySchema<T extends Schema<any, any>> extends Schema<
  Array<s.infer<T>>
> {
  private itemSchema: T;
  private tupleSchemas?: Schema<any, any>[];

  constructor(
    config: ValidatorConfig<any> & { validate: { ofType?: T; items?: any } }
  ) {
    super("array", config, validatorMap, preparationMap, transformationMap);
    const { validate } = config as {
      validate?: { ofType?: T; items?: Schema<any, any>[] };
    };
    if (!validate || !validate.ofType) {
      // This should not happen with proper static typing, but as a safeguard:
      throw new Error(
        "s.array() requires an 'ofType' validator configuration."
      );
    }
    this.itemSchema = validate.ofType;
    if (validate.items) {
      this.tupleSchemas = validate.items;
    }
  }

  public async _parse(context: ValidationContext): Promise<Array<s.infer<T>>> {
    let current_value: any = context.value;

    // Run array-level preparations
    for (const { preparation, args } of this.preparations) {
      current_value = await preparation(
        current_value,
        args,
        { ...context, value: current_value },
        this
      );
    }
    for (const customPreparation of this.customPreparations) {
      current_value = await customPreparation(
        current_value,
        [],
        { ...context, value: current_value },
        this
      );
    }

    if (this.config.optional && current_value === undefined) {
      return undefined as any;
    }
    if (this.config.nullable && current_value === null) {
      return null as any;
    }

    if (!Array.isArray(current_value)) {
      throw new ValidationError([
        {
          path: context.path,
          message: `Invalid type. Expected array, received ${typeof current_value}.`,
        },
      ]);
    }

    // Item-level parsing and validation
    const newArray: any[] = [];
    const issues: ValidationIssue[] = [];
    for (let i = 0; i < current_value.length; i++) {
      try {
        const parsedValue = await this.itemSchema.parse({
          ...context,
          path: [...context.path, i],
          value: current_value[i],
        });
        newArray.push(parsedValue);
      } catch (e) {
        if (e instanceof ValidationError) {
          issues.push(...e.issues);
        } else {
          throw e;
        }
      }
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    let finalValue: any = newArray;

    // Handle tuple validation if 'items' is present
    if (this.tupleSchemas) {
      if (current_value.length !== this.tupleSchemas.length) {
        issues.push({
          path: context.path,
          message: `Expected a tuple of length ${this.tupleSchemas.length}, but received ${current_value.length}.`,
        });
      } else {
        for (let i = 0; i < this.tupleSchemas.length; i++) {
          const itemSchema = this.tupleSchemas[i];
          const item = current_value[i];
          try {
            const parsedItem = await itemSchema.parse({
              ...context,
              path: [...context.path, i],
              value: item,
            });
            finalValue[i] = parsedItem; // Overwrite the value from the 'ofType' pass
          } catch (error) {
            if (error instanceof ValidationError) {
              issues.push(...error.issues);
            } else {
              issues.push({
                path: [...context.path, i],
                message: "Invalid tuple item",
              });
            }
          }
        }
      }
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    // Run array-level validators (length, etc.)
    for (const { name, validator, args } of this.validators) {
      if (name === "identity" || name === "ofType") continue;
      const result = await validator(
        finalValue,
        args,
        { ...context, value: finalValue },
        this
      );
      if (!result) {
        const path = context.path.join(".");
        const messages = this.config.messages as
          | { [key: string]: string }
          | undefined;
        let message = messages?.[name];
        if (!message) {
          message = `Validation failed for array.${name} at path '${path}'`;
        }
        issues.push({ path: context.path, message });
      }
    }
    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    // Array-level transformations
    for (const { transformation, args } of this.transformations) {
      finalValue = await transformation(
        finalValue,
        args,
        { ...context, value: finalValue },
        this
      );
    }
    for (const customTransformation of this.customTransformations) {
      finalValue = await customTransformation(
        finalValue,
        [],
        { ...context, value: finalValue },
        this
      );
    }

    return finalValue;
  }
}

class RecordSchema<
  K extends Schema<string | number, any>,
  V extends Schema<any, any>
> extends Schema<Record<s.infer<K>, s.infer<V>>> {
  private keySchema: K;
  private valueSchema: V;

  constructor(keySchema: K, valueSchema: V, config: ValidatorConfig<any> = {}) {
    super("record", config, validatorMap, preparationMap, transformationMap);
    this.keySchema = keySchema;
    this.valueSchema = valueSchema;
  }

  public async _parse(
    context: ValidationContext
  ): Promise<Record<s.infer<K>, s.infer<V>>> {
    let current_value: any = context.value;

    if (
      typeof current_value !== "object" ||
      current_value === null ||
      Array.isArray(current_value)
    ) {
      throw new ValidationError([
        { path: context.path, message: "Input must be a record-like object." },
      ]);
    }

    const finalRecord: Record<string | number, s.infer<V>> = {};
    const issues: ValidationIssue[] = [];

    for (const [key, value] of Object.entries(current_value)) {
      let parsedKey: s.infer<K>;
      let parsedValue: s.infer<V>;

      try {
        parsedKey = (await this.keySchema.parse({
          ...context,
          path: [...context.path, key],
          value: key,
        })) as s.infer<K>;
      } catch (error) {
        if (error instanceof ValidationError) {
          issues.push(...error.issues);
        } else {
          issues.push({
            path: [...context.path, key],
            message: "Invalid key",
          });
        }
        continue;
      }

      try {
        parsedValue = await this.valueSchema.parse({
          ...context,
          path: [...context.path, key],
          value: value,
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          issues.push(...error.issues);
        } else {
          issues.push({
            path: [...context.path, key],
            message: "Invalid value",
          });
        }
        continue;
      }

      finalRecord[parsedKey as any] = parsedValue;
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    return finalRecord as Record<s.infer<K>, s.infer<V>>;
  }
}

type SwitchCase<T> = Record<string | number, Schema<T>>;
type SwitchDefault<T> = Schema<T> | undefined;

class SwitchSchema<
  TKey extends string | number,
  TCases extends SwitchCase<any>,
  TDefault extends SwitchDefault<any>
> extends Schema<
  | s.infer<TCases[TKey]>
  | (TDefault extends Schema<any, any> ? s.infer<TDefault> : never)
> {
  private keyFn: (context: ValidationContext) => TKey;
  private schemas: TCases;
  private defaultSchema?: TDefault;

  constructor(
    keyFn: (context: ValidationContext) => TKey,
    schemas: TCases,
    defaultSchema?: TDefault
  ) {
    super(
      "switch",
      {},
      validatorMap as SchemaValidatorMap,
      preparationMap,
      transformationMap
    );
    this.keyFn = keyFn;
    this.schemas = schemas;
    this.defaultSchema = defaultSchema;
  }

  public async _parse(context: ValidationContext): Promise<any> {
    const key = this.keyFn(context);
    const schema = this.schemas[key] || this.defaultSchema;

    if (schema) {
      return schema.parse(context);
    }
    return context.value;
  }
}

class MapSchema<
  K extends Schema<any, any>,
  V extends Schema<any, any>
> extends Schema<Map<InferSchemaType<K>, InferSchemaType<V>>> {
  private keySchema: K;
  private valueSchema: V;

  constructor(keySchema: K, valueSchema: V) {
    super(
      "map",
      {},
      validatorMap as SchemaValidatorMap,
      preparationMap,
      transformationMap
    );
    this.keySchema = keySchema;
    this.valueSchema = valueSchema;
  }

  public async _parse(
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

class SetSchema<V extends Schema<any, any>> extends Schema<
  Set<InferSchemaType<V>>
> {
  private valueSchema: V;

  constructor(valueSchema: V) {
    super(
      "set",
      {},
      validatorMap as SchemaValidatorMap,
      preparationMap,
      transformationMap
    );
    this.valueSchema = valueSchema;
  }

  public async _parse(
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
    super(
      "instanceof",
      {},
      validatorMap as SchemaValidatorMap,
      preparationMap,
      transformationMap
    );
    this.constructorFn = constructorFn;
  }

  public async _parse(context: ValidationContext): Promise<InstanceType<T>> {
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
    super(
      "literal",
      {},
      validatorMap as SchemaValidatorMap,
      preparationMap,
      transformationMap
    );
    this.literal = literal;
  }

  public async _parse(context: ValidationContext): Promise<T> {
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

class UnionSchema<
  T extends [Schema<any, any>, ...Schema<any, any>[]]
> extends Schema<InferSchemaType<T[number]>> {
  private schemas: T;

  constructor(schemas: T) {
    super(
      "union",
      {},
      validatorMap as SchemaValidatorMap,
      preparationMap,
      transformationMap
    );
    this.schemas = schemas;
  }

  public async _parse(
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
  [K in keyof Omit<TMap, "object" | "array">]: <
    C extends ValidatorConfig<TMap[K]>
  >(
    config?: C
  ) => Schema<
    InferDataType<TMap[K]>,
    C extends { prepare: any } ? unknown : InferDataType<TMap[K]>
  >;
} & {
  object<P extends SObjectProperties>(
    config: SObjectOptions<P>
  ): ObjectSchema<P, WithLoose<InferSObjectType<P>>>;
} & {
  switch<
    TKey extends string | number,
    TCases extends SwitchCase<any>,
    TDefault extends SwitchDefault<any>
  >(
    keyFn: (context: ValidationContext) => TKey,
    schemas: TCases,
    defaultSchema?: TDefault
  ): SwitchSchema<TKey, TCases, TDefault>;
  record<K extends Schema<string | number, any>, V extends Schema<any, any>>(
    keySchema: K,
    valueSchema: V
  ): RecordSchema<K, V>;
  union<T extends [Schema<any, any>, ...Schema<any, any>[]]>(
    schemas: T
  ): UnionSchema<T>;
  literal<T extends string | number | boolean | null | undefined>(
    literal: T
  ): LiteralSchema<T>;
  map<K extends Schema<any, any>, V extends Schema<any, any>>(
    keySchema: K,
    valueSchema: V
  ): MapSchema<K, V>;
  set<V extends Schema<any, any>>(valueSchema: V): SetSchema<V>;
  instanceof<T extends new (...args: any) => any>(
    constructorFn: T
  ): InstanceOfSchema<T>;
  array<T extends Schema<any, any>>(
    config: ValidatorConfig<any> & { validate: { ofType: T } }
  ): ArraySchema<T>;
};

function createSchemaFunction<
  TMap extends SchemaValidatorMap,
  K extends keyof TMap
>(dataType: K, validatorMap: TMap) {
  return function <C extends ValidatorConfig<TMap[K]>>(config?: C) {
    type BaseType = InferDataType<TMap[K]>;

    type WithOptional = C extends { optional: true }
      ? BaseType | undefined
      : BaseType;
    type WithNullable = C extends { nullable: true }
      ? WithOptional | null
      : WithOptional;

    type InputType = C extends { prepare: Record<string, unknown> }
      ? unknown
      : WithNullable;

    return new Schema<WithNullable, InputType>(
      dataType as string,
      (config || {}) as any,
      validatorMap,
      preparationMap,
      transformationMap
    );
  };
}

export function createSchemaBuilder<TMap extends SchemaValidatorMap>(
  validatorMap: TMap,
  preparationMap: Record<string, any>,
  transformationMap: Record<string, any>
): CreateSchemaBuilder<TMap> {
  const builder: any = {};

  for (const key in validatorMap) {
    if (key === "object" || key === "array") continue;
    builder[key] = createSchemaFunction(key, validatorMap);
  }

  builder.object = <P extends SObjectProperties>(config: SObjectOptions<P>) =>
    new ObjectSchema(config);

  builder.array = <T extends Schema<any, any>>(
    config: ValidatorConfig<any> & { validate: { ofType: T } }
  ) => new ArraySchema(config);

  builder.record = <
    K extends Schema<string | number, any>,
    V extends Schema<any, any>
  >(
    keySchema: K,
    valueSchema: V,
    config?: ValidatorConfig<any>
  ) => new RecordSchema(keySchema, valueSchema, config);

  builder.switch = <
    TKey extends string | number,
    TCases extends SwitchCase<any>,
    TDefault extends SwitchDefault<any>
  >(
    keyFn: (context: ValidationContext) => TKey,
    schemas: TCases,
    defaultSchema?: TDefault
  ) => {
    return new SwitchSchema(keyFn, schemas, defaultSchema);
  };

  builder.union = <T extends [Schema<any, any>, ...Schema<any, any>[]]>(
    schemas: T
  ) => {
    return new UnionSchema(schemas);
  };

  builder.literal = <T extends string | number | boolean | null | undefined>(
    literal: T
  ) => {
    return new LiteralSchema(literal);
  };

  builder.map = <K extends Schema<any, any>, V extends Schema<any, any>>(
    keySchema: K,
    valueSchema: V
  ) => {
    return new MapSchema(keySchema, valueSchema);
  };

  builder.set = <V extends Schema<any, any>>(valueSchema: V) => {
    return new SetSchema(valueSchema);
  };

  builder.instanceof = <T extends new (...args: any) => any>(
    constructorFn: T
  ) => {
    return new InstanceOfSchema(constructorFn);
  };

  return builder;
}

export const s = createSchemaBuilder(
  validatorMap,
  preparationMap,
  transformationMap
);

export namespace s {
  export type infer<T extends Schema<any, any>> = T extends Schema<infer U, any>
    ? U
    : never;
}
