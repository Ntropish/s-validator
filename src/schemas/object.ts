import { Schema } from "./schema.js";
import {
  SObjectProperties,
  InferSObjectType,
  ValidatorConfig,
  ValidationContext,
  ValidationIssue,
  ValidationError,
  MessageProducer,
} from "../types.js";

type Maps = {
  validatorMap: any;
  preparationMap: any;
  transformationMap: any;
  messageMap: any;
};

export class ObjectSchema<
  P extends SObjectProperties,
  T = InferSObjectType<P>
> extends Schema<T> {
  private properties: P;

  constructor(config: Record<string, unknown> = {}, maps?: Maps) {
    const properties = (config?.validate as any)?.properties ?? {};
    super("object", config, maps);
    this.properties = properties;
    if (this.maps) {
      for (const key in this.properties) {
        if (Object.prototype.hasOwnProperty.call(this.properties, key)) {
          this.properties[key].maps = this.maps;
        }
      }
    }
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
          rootData: context.rootData,
          path: [...context.path, key],
          value: newValue[key],
          ctx: context.ctx,
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
      const newContext = {
        rootData: context.rootData,
        path: [...context.path, key],
        value: propertyValue,
        ctx: context.ctx,
      };

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
          newValue as T,
          [],
          {
            ...context,
            value: newValue,
          },
          this
        ))
      ) {
        const messages = (this.config as ValidatorConfig<any>).messages ?? {};
        const messageProducerContext = {
          label: this.label,
          value: newValue,
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
          rootData: context.rootData,
          path: [...context.path, key],
          value: newValue[key],
          ctx: context.ctx,
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
    return new ObjectSchema(newConfig as any, this.maps);
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
    return new ObjectSchema(newConfig as any, this.maps);
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
    return new ObjectSchema(newConfig as any, this.maps);
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
    return new ObjectSchema(newConfig as any, this.maps);
  }
}
