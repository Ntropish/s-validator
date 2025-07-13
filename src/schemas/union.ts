import { Schema } from "./schema.js";
import {
  InferSchemaType,
  ValidationContext,
  ValidationError,
  ValidationIssue,
  ValidatorConfig,
} from "../types.js";

export class UnionSchema<
  TVariants extends readonly [Schema<any, any>, ...Schema<any, any>[]],
  TOutput = InferSchemaType<TVariants[number]>,
  TInput = TOutput
> extends Schema<TOutput, TInput> {
  private variants: TVariants;

  constructor(variants: TVariants, config: ValidatorConfig<TOutput>) {
    super("union", config);
    this.variants = variants;
  }

  async _validate(value: any, context: ValidationContext): Promise<any> {
    const issues: ValidationIssue[] = [];

    for (const variant of this.variants) {
      try {
        const result = await variant.safeParse(value, context.ctx);
        if (result.status === "success") {
          // Found a valid schema, return the (potentially transformed) value
          return result.data;
        } else {
          issues.push(...result.error.issues);
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          issues.push(...error.issues);
        } else {
          // Re-throw unexpected errors
          throw error;
        }
      }
    }

    // If no variant matched, throw a validation error with all collected issues
    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    // This part should ideally not be reached if there's at least one variant,
    // but as a fallback, we call super._validate
    return await super._validate(value, context);
  }

  async _transform(value: any, context: ValidationContext): Promise<TOutput> {
    // The transformation is handled during the _validate step for unions,
    // as we need to find the first valid schema and use its transformed output.
    // We just return the value as-is, because it's already the transformed result
    // from the successful safeParse call in _validate.
    return value;
  }
}
