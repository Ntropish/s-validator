import { type Schema } from "./schemas/schema.js";
import { SwitchConfig } from "./schemas/switch.js";

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

export type Validator<TOutput, TInput = unknown> = {
  dataType: string;
  prepare?: PreparationCollection<TInput>;
  transform?: TransformationCollection<TOutput>;
  validate?: ValidatorCollection<TOutput> & {
    identity: {
      validator: (
        value: unknown,
        args: any[],
        context: ValidationContext,
        schema: Schema<any, any>
      ) => boolean | Promise<boolean>;
      message: MessageProducer;
    };
  };
};

export function definePlugin<TOutput, TInput = unknown>(
  plugin: Validator<TOutput, TInput>
): Validator<TOutput, TInput> {
  return plugin;
}

// The main map of all data types to their validator collections.
export type SchemaValidatorMap = {
  [dataType: string]: {
    identity: ValidatorFunction;
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

// A utility to force TS to expand a type in tooltips for better DX.
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

// The keys of T that can be undefined
export type UndefinedKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];

// Make properties of T optional if their value can be undefined
export type UndefinedToOptional<T> = Prettify<
  { [K in Exclude<keyof T, UndefinedKeys<T>>]: T[K] } & {
    [K in UndefinedKeys<T>]?: T[K];
  }
>;

export type CustomValidator<TOutput> =
  | ((
      value: TOutput,
      args: any[],
      context: ValidationContext,
      schema: any
    ) => any)
  | {
      validator: (
        value: TOutput,
        args: any[],
        context: ValidationContext,
        schema: any
      ) => any;
      message?: string | MessageProducer;
      name?: string;
    };

// Creates a typed config object from a validator collection.
export type ValidatorConfig<VCollection> = {
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

export type InferSchemaType<T extends Schema<any, any>> = T extends Schema<
  infer U,
  any
>
  ? U
  : never;

export type SObjectProperties = Record<string, Schema<any, any>>;
export type InferSObjectType<P extends SObjectProperties> = Prettify<
  UndefinedToOptional<{
    [K in keyof P]: InferSchemaType<P[K]>;
  }>
>;
