import { Schema } from "../index.js";

// A stripped-down interface that recursive validators use to call `parse`.
export interface SchemaLike {
  readonly config: Record<string, unknown>;
  parse(data: any, ctx?: any): any;
  safeParse(data: any, ctx?: any): Promise<SafeParseResult<any>>;
}

// The simplified context object passed through the validation chain.
export interface ValidationContext {
  /** The original, top-level data passed to `parse()`. */
  rootData: any;
  /** The path from the root to the current value being validated. */
  path: (string | number)[];
  /** The value at the current path. */
  value: any;
  /** The user-provided context object. */
  ctx?: any;
}

export interface MessageProducerContext {
  label: string;
  value: any;
  path: (string | number)[];
  args: any[];
  dataType: string;
  ctx?: any;
  schema: Schema<any, any>;
}

export type MessageProducer = (context: MessageProducerContext) => string;

// The simplified function signature for a single preparation.
export type PreparationFunction<T = any, Args extends any[] = any[]> = (
  value: T,
  args: Args,
  context: ValidationContext,
  schema: Schema<T, any>
) => any | Promise<any>;

// The simplified function signature for a single transformation.
export type TransformationFunction<T = any, Args extends any[] = any[]> = (
  value: T,
  args: Args,
  context: ValidationContext,
  schema: Schema<T, any>
) => any | Promise<any>;

// The simplified function signature for a single validator.
export type ValidatorFunction<T = any, Args extends any[] = any[]> = (
  value: T,
  args: Args,
  context: ValidationContext,
  schema: Schema<T, any>
) => boolean | Promise<boolean>;

export type ValidatorDefinition<T = any> = {
  validator: ValidatorFunction<T, any[]>;
  message: MessageProducer;
};

// A collection of preparations for a specific data type.
export type PreparationCollection<T = any> = {
  [preparationName: string]: PreparationFunction<T, any[]>;
};

// A collection of transformations for a specific data type.
export type TransformationCollection<T = any> = {
  [transformationName: string]: TransformationFunction<T, any[]>;
};

// A collection of validators for a specific data type.
export type ValidatorCollection<T = any> = {
  [validatorName: string]: ValidatorDefinition<T>;
};

export interface PluginDataTypeConfiguration {
  prepare?: PreparationCollection;
  transform?: TransformationCollection;
  validate?: ValidatorCollection;
}

export type Plugin = {
  [dataType: string]: PluginDataTypeConfiguration[];
};

// The main map of all data types to their validator collections.
export type SchemaValidatorMap = {
  [dataType: string]: {
    [validatorName: string]: ValidatorFunction;
  };
};

export type ValidationIssue = {
  path: readonly (string | number)[];
  message: string;
};

export class ValidationError extends Error {
  public issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(issues[0]?.message || "Validation failed");
    this.issues = issues;
    this.name = "ValidationError";
  }
}

export type SafeParseSuccess<T> = {
  status: "success";
  data: T;
};

export type SafeParseError = {
  status: "error";
  error: ValidationError;
};

export type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseError;

export { Schema };
