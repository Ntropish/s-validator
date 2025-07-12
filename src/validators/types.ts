import { Schema } from "../index.js";

// A stripped-down interface that recursive validators use to call `parse`.
export interface SchemaLike {
  readonly config: Record<string, unknown>;
  parse(context: ValidationContext): any;
  safeParse(context: ValidationContext): Promise<SafeParseResult<any>>;
}

// The simplified context object passed through the validation chain.
export type ValidationContext = {
  /** The original, top-level data passed to `parse()`. */
  readonly rootData: any;
  /** The path from the root to the current value being validated. */
  readonly path: ReadonlyArray<string | number>;
  /** The value at the current path. */
  readonly value: any;
};

// The simplified function signature for a single validator.
export type ValidatorFunction<T = any, Args extends any[] = any[]> = (
  value: T,
  args: Args,
  context: ValidationContext,
  schema: Schema<T>
) => boolean | Promise<boolean>;

// A collection of validators for a specific data type.
export type ValidatorCollection<T = any> = {
  identity: ValidatorFunction<unknown, []>;
} & {
  [validatorName: string]: ValidatorFunction<T, any[]>;
};

// The main map of all data types to their validator collections.
export type SchemaValidatorMap = {
  [dataType: string]: ValidatorCollection<any>;
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
