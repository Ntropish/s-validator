import {
  PreparationFunction,
  TransformationFunction,
  ValidatorFunction,
  ValidationContext,
  ValidationIssue,
  ValidationError,
  MessageProducerContext,
  MessageProducer,
  SafeParseResult,
  ValidatorConfig,
  CustomValidator,
} from "../types.js";

import {
  validatorMap,
  preparationMap,
  transformationMap,
  messageMap,
} from "../validator-map.js";

import { StandardSchemaV1 } from "../standard-schema.js";

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
      vendor: "s-validator",
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
      const customValidatorFn =
        typeof customValidator === "object"
          ? customValidator.validator
          : customValidator;
      const customMessage =
        typeof customValidator === "object"
          ? customValidator.message
          : undefined;
      const customValidatorName =
        typeof customValidator === "object" ? customValidator.name : undefined;

      if (
        !(await customValidatorFn(
          current_value,
          [],
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

        let message: string | undefined =
          typeof customMessage === "function"
            ? customMessage(messageProducerContext)
            : customMessage;

        if (!message) {
          const userMessage =
            messages[customValidatorName as keyof typeof messages] ??
            messages["custom"];
          if (typeof userMessage === "string") {
            message = userMessage;
          } else if (typeof userMessage === "function") {
            message = (userMessage as MessageProducer)(messageProducerContext);
          } else {
            const defaultMessageProducer = (messageMap as any)[this.dataType]?.[
              "custom"
            ];
            if (defaultMessageProducer) {
              message = defaultMessageProducer(messageProducerContext);
            }
          }
        }

        issues.push({
          path: context.path,
          message:
            message ??
            `Custom validation failed for ${
              customValidatorName ?? this.dataType
            }`,
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
