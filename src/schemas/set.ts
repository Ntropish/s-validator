import { Schema } from "./schema.js";
import {
  InferSchemaType,
  ValidationContext,
  ValidationError,
  ValidationIssue,
} from "../types.js";

export class SetSchema<
  TValue extends Schema<any, any>,
  TOutput = Set<InferSchemaType<TValue>>,
  TInput = TOutput
> extends Schema<TOutput, TInput> {
  protected valueSchema: TValue;

  constructor(itemSchema: TValue, config: Record<string, unknown> = {}) {
    super("set", config);
    this.valueSchema = itemSchema;
  }

  async _prepare(context: ValidationContext): Promise<any> {
    const preparedValue = await super._prepare(context);

    if (!(preparedValue instanceof Set)) {
      return preparedValue;
    }

    const preparedSet = new Set();
    const preparationPromises = Array.from(preparedValue).map(
      async (item, i) => {
        const preparedItem = await this.valueSchema._prepare({
          rootData: context.rootData,
          path: [...context.path, i],
          value: item,
          ctx: context.ctx,
        });
        preparedSet.add(preparedItem);
      }
    );

    await Promise.all(preparationPromises);
    return preparedSet;
  }

  async _validate(value: Set<any>, context: ValidationContext): Promise<any> {
    await super._validate(value, context);

    if (this.config.optional && value === undefined) {
      return undefined;
    }
    if (this.config.nullable && value === null) {
      return null;
    }

    if (!(value instanceof Set)) {
      return;
    }

    const issues: ValidationIssue[] = [];
    const validatedSet = new Set();

    const validationPromises = Array.from(value).map(async (item, i) => {
      const newContext = {
        rootData: context.rootData,
        path: [...context.path, i],
        value: item,
        ctx: context.ctx,
      };
      try {
        const validatedItem = await this.valueSchema._validate(
          item,
          newContext
        );
        validatedSet.add(validatedItem);
      } catch (error) {
        if (error instanceof ValidationError) {
          issues.push(...error.issues);
        } else {
          throw error;
        }
      }
    });

    await Promise.all(validationPromises);

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    return validatedSet;
  }

  async _transform(value: Set<any>, context: ValidationContext): Promise<any> {
    const transformedValue: Set<any> = (await super._transform(
      value,
      context
    )) as any;

    if (!(transformedValue instanceof Set)) {
      return transformedValue;
    }

    const newSet = new Set<InferSchemaType<TValue>>();
    const transformPromises = Array.from(transformedValue).map(
      async (item, i) => {
        const transformedItem = await this.valueSchema._transform(item, {
          rootData: context.rootData,
          path: [...context.path, i],
          value: item,
          ctx: context.ctx,
        });
        newSet.add(transformedItem);
      }
    );

    await Promise.all(transformPromises);
    return newSet;
  }
}
