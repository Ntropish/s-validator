import { Schema } from './schemas/schema.js';
export interface SchemaLike {
    readonly config: Record<string, unknown>;
    parse(data: any, ctx?: any): any;
    safeParse(data: any, ctx?: any): Promise<SafeParseResult<any>>;
}
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
export type PreparationFunction<T = any, Args extends any[] = any[]> = (value: T, args: Args, context: ValidationContext, schema: Schema<T, any>) => any | Promise<any>;
export type TransformationFunction<T = any, Args extends any[] = any[]> = (value: T, args: Args, context: ValidationContext, schema: Schema<T, any>) => any | Promise<any>;
export type ValidatorFunction<T = any, Args extends any[] = any[]> = (value: T, args: Args, context: ValidationContext, schema: Schema<T, any>) => boolean | Promise<boolean>;
export type ValidatorDefinition<T = any> = {
    validator: ValidatorFunction<T, any[]>;
    message: MessageProducer;
};
export type PreparationCollection<T = any> = {
    [preparationName: string]: PreparationFunction<T, any[]>;
};
export type TransformationCollection<T = any> = {
    [transformationName: string]: TransformationFunction<T, any[]>;
};
export type ValidatorCollection<T = any> = {
    [validatorName: string]: ValidatorDefinition<T>;
};
export type Validator<TOutput, TInput = unknown> = {
    dataType: string;
    prepare?: PreparationCollection<TInput>;
    transform?: TransformationCollection<TOutput>;
    validate?: ValidatorCollection<TOutput> & {
        identity: {
            validator: (value: unknown, args: any[], context: ValidationContext, schema: Schema<any, any>) => boolean | Promise<boolean>;
            message: MessageProducer;
        };
    };
};
export declare function definePlugin<TOutput, TInput = unknown>(plugin: Validator<TOutput, TInput>): Validator<TOutput, TInput>;
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
export declare class ValidationError extends Error {
    issues: ValidationIssue[];
    constructor(issues: ValidationIssue[]);
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
export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
export type UndefinedKeys<T> = {
    [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];
export type UndefinedToOptional<T> = Prettify<{
    [K in Exclude<keyof T, UndefinedKeys<T>>]: T[K];
} & {
    [K in UndefinedKeys<T>]?: T[K];
}>;
export type CustomValidator<TOutput> = ((value: TOutput, args: any[], context: ValidationContext, schema: any) => any) | {
    validator: (value: TOutput, args: any[], context: ValidationContext, schema: any) => any;
    message?: string | MessageProducer;
    name?: string;
};
export type ValidatorConfig<VCollection> = {
    optional?: boolean;
    nullable?: boolean;
    label?: string;
    messages?: Prettify<{
        [K in keyof Omit<VCollection, "identity" | "messages" | "preparations" | "transformations">]?: string;
    } & {
        identity?: string;
    }>;
    prepare?: Record<string, any> & {
        custom?: ((value: any) => any)[];
    };
    validate?: Record<string, any> & {
        custom?: CustomValidator<any> | CustomValidator<any>[];
    };
    transform?: Record<string, any> & {
        custom?: ((value: any) => any)[];
    };
};
export type InferSchemaType<T extends Schema<any, any>> = T extends Schema<infer U, any> ? U : never;
export type SObjectProperties = Record<string, Schema<any, any>>;
export type InferSObjectType<P extends SObjectProperties> = Prettify<UndefinedToOptional<{
    [K in keyof P]: InferSchemaType<P[K]>;
}>>;
