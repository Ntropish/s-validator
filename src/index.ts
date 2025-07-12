// This is a test to confirm the editing process is working.
import {
  validatorMap,
  preparationMap,
  transformationMap,
  messageMap,
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
  MessageProducer,
  MessageProducerContext,
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
  public label: string;
  public readonly "~standard": StandardSchemaV1.Props<TInput, TOutput>;

  constructor(
    dataType: string,
    config: Record<string, unknown> = {},
    validatorMap: SchemaValidatorMap,
    preparationMap: Record<string, any>,
    transformationMap: Record<string, any>
  ) {
    this.dataType = dataType;
    this.config = config; // Keep original config for modifiers

    const {
      prepare,
      validate,
      transform,
      // messages, optional, and nullable are read from this.config
      ...rest
    } = config as ValidatorConfig<any> & Record<string, any>;

    this.label =
      (config.label as string) ||
      this.dataType.charAt(0).toUpperCase() + this.dataType.slice(1);

    const validatorCollection = (validatorMap as any)[dataType];
    const preparationCollection = (preparationMap as any)[dataType];
    const transformationCollection = (transformationMap as any)[dataType];

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
          this.customPreparations = prepConfig as any[];
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

    const validationRules = { ...(validate || {}), ...rest };
    if (validationRules) {
      for (let [valName, valConfig] of Object.entries(validationRules)) {
        if (valName === "custom") {
          this.customValidators = this.customValidators.concat(
            Array.isArray(valConfig) ? valConfig : [valConfig]
          );
          continue;
        }
        // a value of `false` for a validator should be ignored
        if (valConfig === false) {
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
          this.customTransformations = transConfig as any[];
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

  public async _prepare(context: ValidationContext): Promise<any> {
    let current_value: any = context.value;
    // Preparations
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
    return current_value;
  }

  public async _validate(
    value: any,
    context: ValidationContext
  ): Promise<void> {
    const issues: ValidationIssue[] = [];
    const messages = (this.config as ValidatorConfig<any>).messages ?? {};
    const current_value = value;

    // Optional/nullable checks must happen on the prepared value
    if (this.config.optional && current_value === undefined) return;
    if (this.config.nullable && current_value === null) return;

    // All validations
    for (const { name, validator, args } of this.validators) {
      if (!(await validator(current_value, args, context, this))) {
        const messageProducerContext: MessageProducerContext = {
          label: this.label,
          value: current_value,
          path: context.path,
          dataType: this.dataType,
          ctx: context.ctx,
          args,
          schema: this,
        };

        let message: string | undefined;
        const userMessage = messages[name];

        if (typeof userMessage === "string") {
          message = userMessage;
        } else if (typeof userMessage === "function") {
          message = (userMessage as MessageProducer)(messageProducerContext);
        } else {
          const defaultMessageProducer = (messageMap as any)[this.dataType]?.[
            name
          ];
          if (defaultMessageProducer) {
            message = defaultMessageProducer(messageProducerContext);
          }
        }

        issues.push({
          path: context.path,
          message: message ?? `Validation failed for ${this.dataType}.${name}`,
        });
        if (name === "identity") break;
      }
    }

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
        let message: string | undefined;

        if (typeof customValidator === "object" && customValidator.message) {
          if (typeof customValidator.message === "string") {
            message = customValidator.message;
          } else {
            message = (customValidator.message as MessageProducer)({
              label: this.label,
              value: current_value,
              path: context.path,
              dataType: this.dataType,
              ctx: context.ctx,
              args: [], // Custom validators don't have 'args' in the same way
              schema: this,
            });
          }
        }

        issues.push({
          path: context.path,
          message: message ?? `Custom validation failed for ${this.dataType}`,
        });
      }
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }
  }

  public async _transform(
    value: any,
    context: ValidationContext
  ): Promise<TOutput> {
    let current_value = value;
    // Transformations
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

  public async parse(data: TInput, ctx?: any): Promise<TOutput> {
    const context: ValidationContext = {
      rootData: data,
      path: [],
      value: data,
      ctx: ctx,
    };

    const preparedValue = await this._prepare(context);
    await this._validate(preparedValue, { ...context, value: preparedValue });
    const transformedValue = await this._transform(preparedValue, {
      ...context,
      value: preparedValue,
    });
    return transformedValue;
  }

  public async safeParse(
    data: TInput,
    ctx?: any
  ): Promise<SafeParseResult<TOutput>> {
    try {
      const parsedData = await this.parse(data, ctx);
      return { status: "success", data: parsedData };
    } catch (e) {
      if (e instanceof ValidationError) {
        return { status: "error", error: e };
      }
      throw e;
    }
  }

  public optional(): Schema<TOutput | undefined, TInput | undefined> {
    return new Schema(
      this.dataType,
      { ...this.config, optional: true },
      validatorMap as any,
      preparationMap as any,
      transformationMap as any
    );
  }

  public nullable(): Schema<TOutput | null, TInput | null> {
    return new Schema(
      this.dataType,
      { ...this.config, nullable: true },
      validatorMap as any,
      preparationMap as any,
      transformationMap as any
    );
  }

  public asKey(): Schema<string | number, TInput> {
    // This is a type-casting method. No runtime logic is needed.
    return this as unknown as Schema<string | number, TInput>;
  }
}

class ObjectSchema<
  P extends SObjectProperties,
  T = InferSObjectType<P>
> extends Schema<T> {
  constructor(config: SObjectOptions<P>) {
    super(
      "object",
      config,
      validatorMap as any,
      preparationMap as any,
      transformationMap as any
    );
  }

  public async _prepare(context: ValidationContext): Promise<any> {
    let preparedObject = await super._prepare(context);

    // Nullable/optional checks on the object itself first
    if (preparedObject === undefined || preparedObject === null) {
      return preparedObject;
    }

    const properties = (this.config as SObjectOptions<P>).properties;
    const newObject: Record<string, any> = { ...preparedObject };

    for (const key in properties) {
      if (Object.prototype.hasOwnProperty.call(newObject, key)) {
        const schema = properties[key];
        const value = newObject[key];
        const childContext = {
          ...context,
          path: [...context.path, key],
          value: value,
        };
        newObject[key] = await schema._prepare(childContext);
      }
    }
    return newObject;
  }

  public async _validate(
    value: any,
    context: ValidationContext
  ): Promise<void> {
    // First, run object-level identity checks and optional/nullable
    await super._validate(value, context);

    const properties = (this.config as SObjectOptions<P>).properties;
    const isStrict = (this.config as SObjectOptions<P>).strict;
    const issues: ValidationIssue[] = [];

    const allKeys = new Set([
      ...Object.keys(value),
      ...Object.keys(properties),
    ]);

    for (const key of allKeys) {
      const schema = properties[key];
      const propertyValue = value[key];
      const childContext = {
        ...context,
        path: [...context.path, key],
        value: propertyValue,
      };

      if (schema) {
        try {
          const result = await schema._validate(propertyValue, childContext);
          console.log("result", result);
        } catch (e) {
          if (e instanceof ValidationError) issues.push(...e.issues);
          else throw e;
        }
      } else if (isStrict && Object.prototype.hasOwnProperty.call(value, key)) {
        issues.push({
          path: childContext.path,
          message: `Unrecognized key: '${key}'`,
        });
      }
    }

    // Now run object-level custom validators AFTER property-level validation
    for (const customValidator of this.customValidators) {
      const result =
        typeof customValidator === "function"
          ? await customValidator(value, { ...context, value })
          : await customValidator.validator(value, { ...context, value });

      if (!result) {
        const message =
          typeof customValidator === "object"
            ? customValidator.message
            : "Custom validation failed";
        issues.push({
          path: context.path,
          message: message || "Custom validation failed for object",
        });
      }
    }

    if (issues.length > 0) throw new ValidationError(issues);
  }

  public async _transform(value: any, context: ValidationContext): Promise<T> {
    if (value === undefined || value === null) return value;

    const properties = (this.config as SObjectOptions<P>).properties;
    const transformedObject: Record<string, any> = { ...value };

    for (const key in properties) {
      if (Object.prototype.hasOwnProperty.call(transformedObject, key)) {
        const schema = properties[key];
        const propertyValue = transformedObject[key];
        const childContext = {
          ...context,
          path: [...context.path, key],
          value: propertyValue,
        };
        transformedObject[key] = await schema._transform(
          propertyValue,
          childContext
        );
      }
    }

    // Finally, run object-level transformations
    return await super._transform(transformedObject, {
      ...context,
      value: transformedObject,
    });
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

  public optional(): Schema<T | undefined, T | undefined> {
    return new ObjectSchema({ ...(this.config as any), optional: true });
  }

  public nullable(): Schema<T | null, T | null> {
    return new ObjectSchema({ ...(this.config as any), nullable: true });
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
    super(
      "array",
      config,
      validatorMap as any,
      preparationMap as any,
      transformationMap as any
    );
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

  public async _prepare(context: ValidationContext): Promise<any> {
    let preparedValue = await super._prepare(context);

    if (
      preparedValue === undefined ||
      preparedValue === null ||
      !Array.isArray(preparedValue)
    ) {
      return preparedValue;
    }

    const preparedArray: any[] = [];
    for (let i = 0; i < preparedValue.length; i++) {
      const item = preparedValue[i];
      const childContext = {
        ...context,
        value: item,
        path: [...context.path, i],
      };
      preparedArray.push(await this.itemSchema._prepare(childContext));
    }
    return preparedArray;
  }

  public async _validate(
    value: any,
    context: ValidationContext
  ): Promise<void> {
    await super._validate(value, context);
    if (value === undefined || value === null) return;

    if (!Array.isArray(value)) {
      throw new ValidationError([
        {
          path: context.path,
          message: `Invalid type. Expected array, received ${typeof value}.`,
        },
      ]);
    }

    const issues: ValidationIssue[] = [];

    // Handle tuple validation first if 'items' is present
    if (this.tupleSchemas) {
      if (value.length !== this.tupleSchemas.length) {
        issues.push({
          path: context.path,
          message: `Expected a tuple of length ${this.tupleSchemas.length}, but received ${value.length}.`,
        });
      } else {
        for (let i = 0; i < this.tupleSchemas.length; i++) {
          const itemSchema = this.tupleSchemas[i];
          const item = value[i];
          const childContext = {
            ...context,
            value: item,
            path: [...context.path, i],
          };
          try {
            await itemSchema._validate(item, childContext);
          } catch (error) {
            if (error instanceof ValidationError) {
              issues.push(...error.issues);
            } else {
              throw error;
            }
          }
        }
      }
    } else {
      // Item-level validation
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        const childContext = {
          ...context,
          value: item,
          path: [...context.path, i],
        };
        try {
          await this.itemSchema._validate(item, childContext);
        } catch (e) {
          if (e instanceof ValidationError) {
            issues.push(...e.issues);
          } else {
            throw e;
          }
        }
      }
    }

    // Run array-level validators (length, etc.) after item validation
    for (const { name, validator, args } of this.validators) {
      if (name === "identity" || name === "ofType" || name === "items")
        continue;
      const result = await validator(
        value,
        args,
        { ...context, value: value },
        this
      );
      if (!result) {
        const messages = this.config.messages as
          | { [key: string]: string }
          | undefined;
        let message = messages?.[name];
        if (!message) {
          message = `Validation failed for array.${name}`;
        }
        issues.push({ path: context.path, message });
      }
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }
  }

  public async _transform(
    value: any,
    context: ValidationContext
  ): Promise<Array<s.infer<T>>> {
    if (value === undefined || value === null || !Array.isArray(value)) {
      return value;
    }

    const transformedArray: any[] = [];
    if (this.tupleSchemas) {
      for (let i = 0; i < value.length; i++) {
        const itemSchema = this.tupleSchemas[i] ?? this.itemSchema;
        const item = value[i];
        const childContext = {
          ...context,
          value: item,
          path: [...context.path, i],
        };
        transformedArray.push(await itemSchema._transform(item, childContext));
      }
    } else {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        const childContext = {
          ...context,
          value: item,
          path: [...context.path, i],
        };
        transformedArray.push(
          await this.itemSchema._transform(item, childContext)
        );
      }
    }

    // Array-level transformations
    return await super._transform(transformedArray, {
      ...context,
      value: transformedArray,
    });
  }

  public optional(): Schema<Array<s.infer<T>> | undefined> {
    return new ArraySchema({ ...(this.config as any), optional: true }) as any;
  }

  public nullable(): Schema<Array<s.infer<T>> | null> {
    return new ArraySchema({ ...(this.config as any), nullable: true }) as any;
  }
}

class RecordSchema<
  K extends Schema<string | number, any>,
  V extends Schema<any, any>
> extends Schema<Record<s.infer<K>, s.infer<V>>> {
  private keySchema: K;
  private valueSchema: V;

  constructor(keySchema: K, valueSchema: V, config: ValidatorConfig<any> = {}) {
    super(
      "record",
      config,
      validatorMap as any,
      preparationMap as any,
      transformationMap as any
    );
    this.keySchema = keySchema;
    this.valueSchema = valueSchema;
  }

  public async _prepare(context: ValidationContext): Promise<any> {
    const value = await super._prepare(context);
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return value;
    }

    const preparedRecord: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      preparedRecord[key] = await this.valueSchema._prepare({
        ...context,
        value: val,
        path: [...context.path, key],
      });
    }
    return preparedRecord;
  }

  public async _validate(
    value: any,
    context: ValidationContext
  ): Promise<void> {
    await super._validate(value, context);

    if (typeof value !== "object" || Array.isArray(value)) {
      throw new ValidationError([
        { path: context.path, message: "Input must be a record-like object." },
      ]);
    }

    const issues: ValidationIssue[] = [];
    for (const [key, val] of Object.entries(value)) {
      const keyContext = {
        ...context,
        value: key,
        path: [...context.path, key],
      };
      try {
        const preparedKey = await this.keySchema._prepare(keyContext);
        await this.keySchema._validate(preparedKey, {
          ...keyContext,
          value: preparedKey,
        });
      } catch (e) {
        if (e instanceof ValidationError) {
          issues.push(
            ...e.issues.map((issue) => ({
              ...issue,
              message: `Invalid key: ${issue.message}`,
            }))
          );
        } else {
          throw e;
        }
      }

      const valueContext = {
        ...context,
        value: val,
        path: [...context.path, key],
      };
      try {
        await this.valueSchema._validate(val, valueContext);
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
  }

  public async _transform(
    value: any,
    context: ValidationContext
  ): Promise<Record<s.infer<K>, s.infer<V>>> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return value;
    }

    const finalRecord: Record<string | number, s.infer<V>> = {};
    for (const [key, val] of Object.entries(value as object)) {
      const valueContext = {
        ...context,
        value: val,
        path: [...context.path, key],
      };

      const transformedKey = await this.keySchema.parse(key);
      const transformedValue = await this.valueSchema._transform(
        val,
        valueContext
      );
      finalRecord[transformedKey as any] = transformedValue;
    }

    return super._transform(finalRecord, {
      ...context,
      value: finalRecord,
    }) as any;
  }

  public optional(): Schema<
    Record<s.infer<K>, s.infer<V>> | undefined,
    Record<s.infer<K>, s.infer<V>> | undefined
  > {
    return new RecordSchema(this.keySchema, this.valueSchema, {
      ...(this.config as any),
      optional: true,
    }) as any;
  }

  public nullable(): Schema<
    Record<s.infer<K>, s.infer<V>> | null,
    Record<s.infer<K>, s.infer<V>> | null
  > {
    return new RecordSchema(this.keySchema, this.valueSchema, {
      ...(this.config as any),
      nullable: true,
    }) as any;
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
      validatorMap as any,
      preparationMap as any,
      transformationMap as any
    );
    this.keyFn = keyFn;
    this.schemas = schemas;
    this.defaultSchema = defaultSchema;
  }

  private getSchema(context: ValidationContext): Schema<any, any> | undefined {
    const key = this.keyFn(context);
    return this.schemas[key] || this.defaultSchema;
  }

  public async _prepare(context: ValidationContext): Promise<any> {
    const schema = this.getSchema(context);
    if (schema) {
      return schema._prepare(context);
    }
    return context.value;
  }

  public async _validate(
    value: any,
    context: ValidationContext
  ): Promise<void> {
    const childContext = { ...context, value };
    const schema = this.getSchema(childContext);
    if (schema) {
      return schema._validate(value, childContext);
    }
  }

  public async _transform(
    value: any,
    context: ValidationContext
  ): Promise<any> {
    const childContext = { ...context, value };
    const schema = this.getSchema(childContext);
    if (schema) {
      return schema._transform(value, childContext);
    }
    return value;
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
      validatorMap as any,
      preparationMap as any,
      transformationMap as any
    );
    this.keySchema = keySchema;
    this.valueSchema = valueSchema;
  }

  public async _prepare(context: ValidationContext): Promise<any> {
    const value = await super._prepare(context);
    if (!(value instanceof Map)) {
      return value;
    }

    const preparedMap = new Map();
    for (const [key, val] of value.entries()) {
      preparedMap.set(
        key,
        await this.valueSchema._prepare({
          ...context,
          value: val,
          path: [...context.path, key, "value"],
        })
      );
    }
    return preparedMap;
  }

  public async _validate(
    value: any,
    context: ValidationContext
  ): Promise<void> {
    await super._validate(value, context);
    if (value === undefined || value === null) return;

    if (!(value instanceof Map)) {
      throw new ValidationError([
        { path: context.path, message: "Invalid type. Expected a Map." },
      ]);
    }

    const issues: ValidationIssue[] = [];
    for (const [key, val] of value.entries()) {
      const keyContext = {
        ...context,
        value: key,
        path: [...context.path, key, "key"],
      };
      try {
        const preparedKey = await this.keySchema._prepare(keyContext);
        await this.keySchema._validate(preparedKey, {
          ...keyContext,
          value: preparedKey,
        });
      } catch (e) {
        if (e instanceof ValidationError) {
          issues.push(
            ...e.issues.map((issue) => ({
              ...issue,
              message: `Invalid key: ${issue.message}`,
            }))
          );
        } else {
          throw e;
        }
      }

      const valueContext = {
        ...context,
        value: val,
        path: [...context.path, key, "value"],
      };
      try {
        await this.valueSchema._validate(val, valueContext);
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
  }

  public async _transform(
    value: any,
    context: ValidationContext
  ): Promise<Map<InferSchemaType<K>, InferSchemaType<V>>> {
    if (!(value instanceof Map)) {
      return value;
    }

    const newMap = new Map();
    for (const [key, val] of value.entries()) {
      const valueContext = {
        ...context,
        value: val,
        path: [...context.path, key, "value"],
      };

      const transformedKey = await this.keySchema.parse(key);
      const transformedValue = await this.valueSchema._transform(
        val,
        valueContext
      );
      newMap.set(transformedKey, transformedValue);
    }

    return super._transform(newMap, { ...context, value: newMap }) as any;
  }

  public optional(): Schema<
    Map<InferSchemaType<K>, InferSchemaType<V>> | undefined
  > {
    return new MapSchema(this.keySchema, this.valueSchema) as any;
  }

  public nullable(): Schema<Map<
    InferSchemaType<K>,
    InferSchemaType<V>
  > | null> {
    return new MapSchema(this.keySchema, this.valueSchema) as any;
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
      validatorMap as any,
      preparationMap as any,
      transformationMap as any
    );
    this.valueSchema = valueSchema;
  }

  public async _prepare(context: ValidationContext): Promise<any> {
    const value = await super._prepare(context);
    if (!(value instanceof Set)) {
      return value;
    }

    const preparedSet = new Set();
    for (const val of value.values()) {
      preparedSet.add(
        await this.valueSchema._prepare({
          ...context,
          value: val,
          path: [...context.path, val],
        })
      );
    }
    return preparedSet;
  }

  public async _validate(
    value: any,
    context: ValidationContext
  ): Promise<void> {
    await super._validate(value, context);
    if (value === undefined || value === null) return;

    if (!(value instanceof Set)) {
      throw new ValidationError([
        { path: context.path, message: "Invalid type. Expected a Set." },
      ]);
    }

    const issues: ValidationIssue[] = [];
    for (const val of value.values()) {
      const valueContext = {
        ...context,
        value: val,
        path: [...context.path, val],
      };
      try {
        await this.valueSchema._validate(val, valueContext);
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
  }

  public async _transform(
    value: any,
    context: ValidationContext
  ): Promise<Set<InferSchemaType<V>>> {
    if (!this.customTransformations.length) {
      return value as Set<InferSchemaType<V>>;
    }
    let current_value = value;
    for (const transform of this.customTransformations) {
      current_value = await transform(current_value, [], context, this);
    }
    return current_value;
  }

  public optional(): Schema<Set<InferSchemaType<V>> | undefined> {
    return new SetSchema(this.valueSchema).optional();
  }
  public nullable(): Schema<Set<InferSchemaType<V>> | null> {
    return new SetSchema(this.valueSchema).nullable();
  }
}

class UnknownSchema extends Schema<unknown, unknown> {
  constructor(config: Record<string, unknown> = {}) {
    super(
      "unknown",
      config,
      { unknown: { identity: (v: any): v is unknown => true } },
      preparationMap as any,
      transformationMap as any
    );
  }
}

class NeverSchema extends Schema<never, never> {
  constructor() {
    super(
      "never",
      {},
      validatorMap as any,
      preparationMap as any,
      transformationMap as any
    );
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
      validatorMap as any,
      preparationMap as any,
      transformationMap as any
    );
    this.literal = literal;
  }

  public async _validate(
    value: any,
    context: ValidationContext
  ): Promise<void> {
    await super._validate(value, context);
    if (this.config.optional && value === undefined) return;
    if (this.config.nullable && value === null) {
      if (this.literal === null) return;
    }

    if (value !== this.literal) {
      throw new ValidationError([
        {
          path: context.path,
          message: `Invalid literal value. Expected ${JSON.stringify(
            this.literal
          )}, received ${JSON.stringify(value)}`,
        },
      ]);
    }
  }

  public optional(): Schema<T | undefined> {
    return new LiteralSchema(this.literal) as any;
  }

  public nullable(): Schema<T | null> {
    return new LiteralSchema(this.literal) as any;
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
      validatorMap as any,
      preparationMap as any,
      transformationMap as any
    );
    this.schemas = schemas;
  }

  public async _validate(
    value: any,
    context: ValidationContext
  ): Promise<void> {
    const issues: ValidationIssue[] = [];
    for (const schema of this.schemas) {
      try {
        await schema._validate(value, context);
        // If one schema validates successfully, the union is valid.
        return;
      } catch (e) {
        if (e instanceof ValidationError) {
          issues.push(...e.issues);
        } else {
          // Re-throw unexpected errors
          throw e;
        }
      }
    }
    // If no schema validated, throw a collected error.
    throw new ValidationError(issues);
  }

  public async _transform(
    value: any,
    context: ValidationContext
  ): Promise<any> {
    for (const schema of this.schemas) {
      try {
        // We need to re-run validate to know which schema to use for transform
        await schema._validate(value, context);
        return schema._transform(value, context);
      } catch (e) {
        // Ignore validation errors and try the next schema
        if (!(e instanceof ValidationError)) {
          throw e;
        }
      }
    }
    // This should be unreachable if validation passed
    return value;
  }

  public optional(): Schema<InferSchemaType<T[number]> | undefined> {
    const newConfig = { ...this.config, optional: true };
    const newUnion = new UnionSchema(this.schemas);
    newUnion.config.optional = true;
    return newUnion as any;
  }

  public nullable(): Schema<InferSchemaType<T[number]> | null> {
    const newConfig = { ...this.config, nullable: true };
    const newUnion = new UnionSchema(this.schemas);
    newUnion.config.nullable = true;
    return newUnion as any;
  }
}

type CreateSchemaBuilder<TMap extends SchemaValidatorMap> = {
  [K in keyof Omit<TMap, "object" | "array" | "unknown" | "never">]: <
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
    config: ValidatorConfig<any> & { validate: { identity: T } }
  ): Schema<InstanceType<T>>;
  array<T extends Schema<any, any>>(
    config: ValidatorConfig<any> & { validate: { ofType: T } }
  ): ArraySchema<T>;
  unknown(config?: Record<string, unknown>): UnknownSchema;
  never(): NeverSchema;
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
      validatorMap as any,
      preparationMap as any,
      transformationMap as any
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
    if (
      key === "object" ||
      key === "array" ||
      key === "unknown" ||
      key === "never"
    )
      continue;
    builder[key] = createSchemaFunction(key, validatorMap as any);
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
    config: ValidatorConfig<any> & { validate: { identity: T } }
  ): Schema<InstanceType<T>> => {
    return new Schema(
      "instanceof",
      config,
      validatorMap,
      preparationMap,
      transformationMap
    );
  };

  builder.unknown = (config?: Record<string, unknown>) =>
    new UnknownSchema(config);
  builder.never = () => new NeverSchema();

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
