import { Schema } from '../index.js';
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
export interface PluginDataTypeConfiguration {
    prepare?: PreparationCollection;
    transform?: TransformationCollection;
    validate?: ValidatorCollection;
}
export type Plugin = {
    [dataType: string]: PluginDataTypeConfiguration[];
};
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
export { Schema };
