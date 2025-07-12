import {
  validatorMap,
  preparationMap,
  transformationMap,
  messageMap,
  plugins,
} from "./validator-map.js";
import { StandardSchemaV1 } from "./standard-schema.js";
import {
  Validator as SValidator,
  ValidatorFunction,
  ValidationContext,
  ValidationIssue,
  ValidationError,
  SafeParseResult,
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
  label?: string;
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

export type SwitchConfig = {
  select: (context: ValidationContext) => any;
  cases: Record<string | number, Schema<any, any>>;
  default?: Schema<any, any>;
  failOnNoMatch?: boolean;
};

type InferSchemaType<T extends Schema<any, any>> = T extends Schema<
  infer U,
  any
>
  ? U
  : never;

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
  protected dataType: string;
  public config: Record<string, unknown>;
  public label: string;
  public readonly "~standard": StandardSchemaV1.Props<TInput, TOutput>;

  constructor(dataType: string, config: Record<string, unknown> = {}) {
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
            args: Array.isArray(valConfig) ? valConfig : [valConfig],
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

  public async _validate(value: any, context: ValidationContext): Promise<any> {
    const issues: ValidationIssue[] = [];
    const messages = (this.config as ValidatorConfig<any>).messages ?? {};
    const current_value = value;

    // Optional/nullable checks must happen on the prepared value
    if (this.config.optional && current_value === undefined) return;
    if (this.config.nullable && current_value === null) return current_value;

    // Run identity validation first
    const identityValidator = this.validators.find(
      (v) => v.name === "identity"
    );
    if (
      identityValidator &&
      !(await identityValidator.validator(
        current_value,
        identityValidator.args,
        { ...context, value: current_value },
        this
      ))
    ) {
      const messageProducerContext: MessageProducerContext = {
        label: this.label,
        value: current_value,
        path: context.path,
        dataType: this.dataType,
        ctx: context.ctx,
        args: [],
        schema: this,
      };

      let message: string | undefined;
      const userMessage = messages["identity"];

      if (typeof userMessage === "string") {
        message = userMessage;
      } else if (typeof userMessage === "function") {
        message = (userMessage as MessageProducer)(messageProducerContext);
      } else {
        const defaultMessageProducer = (messageMap as any)[this.dataType]?.[
          "identity"
        ];
        if (defaultMessageProducer) {
          message = defaultMessageProducer(messageProducerContext);
        }
      }

      issues.push({
        path: context.path,
        message: message ?? `Validation failed for ${this.dataType}.identity`,
      });

      // If identity fails, no other validators should run for this schema
      if (issues.length > 0) {
        throw new ValidationError(issues);
      }
    }

    // All other validations
    for (const { name, validator, args } of this.validators) {
      if (name === "identity") continue; // Already handled
      try {
        if (
          !(await validator(
            current_value,
            args,
            { ...context, value: current_value },
            this
          ))
        ) {
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
            message:
              message ?? `Validation failed for ${this.dataType}.${name}`,
          });
        }
      } catch (e) {
        if (e instanceof ValidationError) {
          issues.push(...e.issues);
        } else {
          throw e;
        }
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

    return current_value;
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
    const result = await this.safeParse(data, ctx);
    if (result.status === "error") {
      throw result.error;
    }
    return result.data;
  }

  public async safeParse(
    data: TInput,
    ctx?: any
  ): Promise<SafeParseResult<TOutput>> {
    const context: ValidationContext = {
      rootData: data,
      path: [],
      value: data,
      ctx: ctx,
    };

    try {
      const preparedValue = await this._prepare(context);

      const validatedValue = await this._validate(preparedValue, {
        ...context,
        value: preparedValue,
      });

      const transformedValue = await this._transform(validatedValue, {
        ...context,
        value: validatedValue,
      });

      return { status: "success", data: transformedValue };
    } catch (error: any) {
      if (error instanceof ValidationError) {
        return { status: "error", error };
      }

      // Catch unexpected errors
      return {
        status: "error",
        error: new ValidationError([
          {
            message: `Unhandled error in schema: ${error.message}`,
            path: context.path,
          },
        ]),
      };
    }
  }

  public optional(): Schema<TOutput | undefined, TInput | undefined> {
    return new Schema(this.dataType, { ...this.config, optional: true });
  }

  public nullable(): Schema<TOutput | null, TInput | null> {
    return new Schema(this.dataType, { ...this.config, nullable: true });
  }

  public asKey(): Schema<string | number, TInput> {
    // This is a type-casting method. No runtime logic is needed.
    return this as unknown as Schema<string | number, TInput>;
  }
}

type SObjectProperties = Record<string, Schema<any, any>>;
type InferSObjectType<P extends SObjectProperties> = Prettify<
  UndefinedToOptional<{
    [K in keyof P]: InferSchemaType<P[K]>;
  }>
>;

class ObjectSchema<
  P extends SObjectProperties,
  T = InferSObjectType<P>
> extends Schema<T> {
  constructor(
    config: ValidatorConfig<any> & { validate?: { properties?: P } }
  ) {
    super("object", config);
  }

  public async _prepare(context: ValidationContext): Promise<any> {
    const preparedValue = await super._prepare(context);

    if (
      preparedValue === null ||
      preparedValue === undefined ||
      typeof preparedValue !== "object"
    ) {
      return preparedValue;
    }

    const shape = this.getProperties();
    const newValue: Record<string, any> = { ...preparedValue };

    for (const key in shape) {
      if (Object.prototype.hasOwnProperty.call(newValue, key)) {
        const propertySchema = shape[key];
        newValue[key] = await propertySchema._prepare({
          ...context,
          value: newValue[key],
          path: [...context.path, key],
        });
      }
    }

    return newValue;
  }

  public async _validate(
    value: Record<string, any>,
    context: ValidationContext
  ): Promise<any> {
    if (this.config.optional && value === undefined) {
      return undefined;
    }
    if (this.config.nullable && value === null) {
      return null;
    }

    // First, run the basic identity check from the base Schema class.
    // This checks if the value is a non-null object.
    await super._validate(value, context);

    const shape = this.getProperties();
    const strict = this.config.strict as boolean;
    const issues: ValidationIssue[] = [];
    const newValue: Record<string, any> = {};

    const propertyPromises = Object.keys(shape).map(async (key) => {
      const propertySchema = shape[key];
      const propertyValue = value[key];
      const newContext = { ...context, path: [...context.path, key] };

      try {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const validatedValue = await propertySchema._validate(
            propertyValue,
            newContext
          );
          newValue[key] = validatedValue;
        } else if (!propertySchema.config.optional) {
          issues.push({
            path: newContext.path,
            message: `Required property '${key}' is missing`,
          });
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          issues.push(...error.issues);
        } else {
          throw error;
        }
      }
    });

    await Promise.all(propertyPromises);

    // Handle unrecognized keys in strict mode.
    if (strict) {
      for (const key in value) {
        if (!shape[key]) {
          issues.push({
            path: [...context.path, key],
            message: `Unrecognized key: '${key}'`,
          });
        }
      }
    } else {
      // Copy over properties that are not in the schema if not in strict mode.
      for (const key in value) {
        if (!shape[key]) {
          newValue[key] = value[key];
        }
      }
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    // Now, with a fully parsed and transformed object, run the custom validators.
    for (const customValidator of this.customValidators) {
      const result =
        typeof customValidator === "function"
          ? await customValidator(newValue as T, {
              ...context,
              value: newValue,
            })
          : await customValidator.validator(newValue as T, {
              ...context,
              value: newValue,
            });

      if (!result) {
        let message: string | undefined;
        if (typeof customValidator === "object" && customValidator.message) {
          message =
            typeof customValidator.message === "string"
              ? customValidator.message
              : (customValidator.message as MessageProducer)({
                  label: this.label,
                  value: newValue,
                  path: context.path,
                  dataType: this.dataType,
                  ctx: context.ctx,
                  args: [],
                  schema: this,
                });
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

    return newValue;
  }

  public async _transform(
    value: Record<string, any>,
    context: ValidationContext
  ): Promise<any> {
    const transformedValue = await super._transform(value, context);
    const shape = this.getProperties();
    const newValue: Record<string, any> = { ...transformedValue };

    const transformPromises = Object.keys(shape).map(async (key) => {
      if (Object.prototype.hasOwnProperty.call(newValue, key)) {
        const propertySchema = shape[key];
        newValue[key] = await propertySchema._transform(newValue[key], {
          ...context,
          value: newValue[key],
          path: [...context.path, key],
        });
      }
    });

    await Promise.all(transformPromises);
    return newValue;
  }

  private getProperties(): P {
    const config = this.config as { validate?: { properties?: P } };
    return config.validate?.properties ?? ({} as P);
  }

  public partial(): ObjectSchema<P, Partial<T>> {
    const originalProperties = this.getProperties();
    const newProperties: { [K in keyof P]?: Schema<any, any> } = {};
    for (const key in originalProperties) {
      newProperties[key] = originalProperties[key].optional();
    }
    const newConfig = {
      ...this.config,
      validate: {
        ...(this.config.validate as Record<string, unknown>),
        properties: newProperties as P,
      },
    };
    return new ObjectSchema(newConfig as any);
  }

  public pick<K extends keyof P & keyof T>(
    keys: K[]
  ): ObjectSchema<Pick<P, K>, Pick<T, K>> {
    const originalProperties = this.getProperties();
    const newProperties: Partial<Pick<P, K>> = {};
    for (const key of keys) {
      if (originalProperties[key]) {
        newProperties[key] = originalProperties[key];
      }
    }
    const newConfig = {
      ...this.config,
      validate: {
        ...(this.config.validate as Record<string, unknown>),
        properties: newProperties as Pick<P, K>,
      },
      strict: true,
    };
    return new ObjectSchema(newConfig as any);
  }

  public omit<K extends keyof P>(
    keys: K[]
  ): ObjectSchema<Omit<P, K>, Omit<T, K>> {
    const originalProperties = this.getProperties();
    const newProperties: Partial<Omit<P, K>> = { ...originalProperties };
    for (const key of keys) {
      delete (newProperties as any)[key];
    }
    const newConfig = {
      ...this.config,
      validate: {
        ...(this.config.validate as Record<string, unknown>),
        properties: newProperties as Omit<P, K>,
      },
      strict: true,
    };
    return new ObjectSchema(newConfig as any);
  }

  public extend<E extends SObjectProperties>(
    extension: E
  ): ObjectSchema<P & E, T & InferSObjectType<E>> {
    const originalProperties = this.getProperties();
    const newProperties = { ...originalProperties, ...extension };
    const newConfig = {
      ...this.config,
      validate: {
        ...(this.config.validate as Record<string, unknown>),
        properties: newProperties,
      },
    };
    return new ObjectSchema(newConfig as any);
  }
}

class ArraySchema<
  T extends Schema<any, any>,
  TOutput = InferSchemaType<T>[]
> extends Schema<TOutput> {
  private itemSchema: T;

  constructor(itemSchema: T, config: ValidatorConfig<any>) {
    const newConfig = { ...config };
    if ((newConfig.validate as any)?.ofType) {
      delete (newConfig.validate as any).ofType;
    }

    super("array", newConfig);
    this.itemSchema = itemSchema;
  }

  public async _prepare(context: ValidationContext): Promise<any> {
    const preparedValue = await super._prepare(context);

    if (!Array.isArray(preparedValue)) {
      return preparedValue;
    }

    const preparedArray: any[] = [];
    for (let i = 0; i < preparedValue.length; i++) {
      const item = preparedValue[i];
      const preparedItem = await this.itemSchema._prepare({
        ...context,
        value: item,
        path: [...context.path, i],
      });
      preparedArray.push(preparedItem);
    }

    return preparedArray;
  }

  public async _validate(value: any[], context: ValidationContext) {
    if (this.config.optional && value === undefined) {
      return [];
    }
    if (this.config.nullable && value === null) {
      return null;
    }

    await super._validate(value, context);

    const issues: ValidationIssue[] = [];
    const newArray: any[] = [];

    const itemPromises = value.map(async (item, i) => {
      const newContext = { ...context, path: [...context.path, i] };
      try {
        const validatedItem = await this.itemSchema._validate(item, newContext);
        newArray[i] = validatedItem;
      } catch (error) {
        if (error instanceof ValidationError) {
          issues.push(...error.issues);
        } else {
          throw error;
        }
      }
    });

    await Promise.all(itemPromises);

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    return newArray;
  }

  public async _transform(
    value: any[],
    context: ValidationContext
  ): Promise<any> {
    const transformedValue = await super._transform(value, context);

    if (!Array.isArray(transformedValue)) {
      return transformedValue;
    }

    const newArray: any[] = [];

    const itemPromises = transformedValue.map(async (item, i) => {
      newArray[i] = await this.itemSchema._transform(item, {
        ...context,
        value: item,
        path: [...context.path, i],
      });
    });

    await Promise.all(itemPromises);
    return newArray;
  }
}

class SwitchSchema extends Schema<any> {
  constructor(config: SwitchConfig) {
    super("switch", config);
  }

  async _validate(value: any, context: ValidationContext): Promise<any> {
    const {
      select,
      cases,
      default: defaultSchema,
      failOnNoMatch,
    } = this.config as SwitchConfig;

    if (!select || !cases) {
      return value;
    }

    const key = select({ ...context, value });
    const caseSchema = cases[key] || defaultSchema;

    if (caseSchema) {
      const result = await caseSchema.safeParse(value, context);
      if (result.status === "error") {
        throw result.error;
      }
      return result.data;
    }

    if (failOnNoMatch) {
      throw new ValidationError([
        {
          path: context.path,
          message: `No case matched for key "${key}" and no default was provided.`,
        },
      ]);
    }

    return value;
  }
}

type Builder = {
  [P in Exclude<
    (typeof plugins)[number],
    { dataType: "switch" | "object" | "literal" }
  > as P["dataType"]]: (
    config?: ValidatorConfig<any>
  ) => Schema<
    P extends SValidator<infer TOutput, any> ? TOutput : never,
    P extends SValidator<any, infer TInput> ? TInput : never
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
