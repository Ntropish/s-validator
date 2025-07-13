import { Schema } from "./schema.js";
import {
  InferSchemaType,
  ValidatorConfig,
  ValidationContext,
  ValidationIssue,
  ValidationError,
} from "../types.js";

export class ArraySchema<
  T extends Schema<any, any>,
  TOutput = InferSchemaType<T>[],
  TInput = TOutput
> extends Schema<TOutput, TInput> {
  private itemSchema: T;

  constructor(itemSchema: T, config: ValidatorConfig<TOutput>) {
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
        rootData: context.rootData,
        path: [...context.path, i],
        value: item,
        ctx: context.ctx,
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
      const newContext = {
        rootData: context.rootData,
        path: [...context.path, i],
        value: item,
        ctx: context.ctx,
      };
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
        rootData: context.rootData,
        path: [...context.path, i],
        value: item,
        ctx: context.ctx,
      });
    });

    await Promise.all(itemPromises);
    return newArray;
  }
}
