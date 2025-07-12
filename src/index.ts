// This is a test to confirm the editing process is working.
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
import { SwitchConfig } from "./validators/switch.js";

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
  private dataType: string;
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

type Builder = {
  [P in Exclude<
    (typeof plugins)[number],
    { dataType: "switch" }
  > as P["dataType"]]: (
    config?: ValidatorConfig<any>
  ) => Schema<
    P extends SValidator<infer TOutput, any> ? TOutput : never,
    P extends SValidator<any, infer TInput> ? TInput : never
  >;
} & {
  switch(config: SwitchConfig): Schema<any>;
};

function createSchemaBuilder(): Builder {
  const builder: any = {};

  for (const plugin of plugins) {
    if (plugin.dataType === "switch") continue;
    builder[plugin.dataType] = (config?: ValidatorConfig<any>) => {
      return new Schema(plugin.dataType, config);
    };
  }

  builder.switch = (config: SwitchConfig) => {
    return new Schema("switch", config as any);
  };

  return builder as Builder;
}

export const s = createSchemaBuilder();

export namespace s {
  export type infer<T extends Schema<any, any>> = T extends Schema<infer U, any>
    ? U
    : never;
}
