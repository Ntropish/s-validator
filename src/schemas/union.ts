import { Schema } from "./schema.js";
import {
  InferSchemaType,
  ValidationContext,
  ValidationError,
  ValidationIssue,
  ValidatorConfig,
} from "../types.js";

export type UnionValidatorConfig<
  TVariants extends readonly [Schema<any, any>, ...Schema<any, any>[]],
  TOutput
> = ValidatorConfig<TOutput> & {
  validate?: {
    of?: TVariants;
  };
};

type Maps = {
  validatorMap: any;
  preparationMap: any;
  transformationMap: any;
  messageMap: any;
};

export class UnionSchema<
  T extends readonly [Schema<any, any>, ...Schema<any, any>[]],
  TOutput,
  TInput
> extends Schema<TOutput, TInput> {
  private schemas: T;

  constructor(config: UnionValidatorConfig<T, TOutput>, maps?: Maps) {
    super("union", config, maps);
    if (!config.validate?.of) {
      throw new Error(
        "Union schema must have variants provided in `validate.of`"
      );
    }
    this.schemas = config.validate.of;
    if (this.maps) {
      for (const schema of this.schemas) {
        schema.maps = this.maps;
      }
    }
  }

  async _validate(value: any, context: ValidationContext): Promise<any> {
    const issues: ValidationIssue[] = [];
    let successfulResult: any = undefined;
    let matched = false;

    for (const variant of this.schemas) {
      try {
        const result = await variant.safeParse(value, context.ctx);
        if (result.status === "success") {
          successfulResult = result.data;
          matched = true;
          break; // Found a valid schema
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

    if (matched) {
      return successfulResult;
    }

    // If no variant matched, run super._validate for union-level validation
    // and then throw a validation error with all collected issues
    try {
      // This will run preparations and transformations on the union itself
      // We pass the original value, as no variant-level transformation has occurred.
      await super._validate(value, context);
    } catch (error) {
      if (error instanceof ValidationError) {
        // Prepend union-level issues to the collected variant issues
        throw new ValidationError([...error.issues, ...issues]);
      }
      throw error; // Re-throw other errors
    }

    // If super._validate passes but no variant matched, throw with variant issues.
    throw new ValidationError(issues);
  }

  async _transform(value: any, context: ValidationContext): Promise<TOutput> {
    // The transformation is handled during the _validate step for unions,
    // as we need to find the first valid schema and use its transformed output.
    // We then pass this value to the base _transform to apply union-level transforms.
    return super._transform(value, context);
  }
}
