import { plugins } from './validator-map.js';
import { StandardSchemaV1 } from './standard-schema.js';
import { Validator as SValidator, ValidatorFunction, ValidationContext, SafeParseResult, PreparationFunction, TransformationFunction } from './validators/types.js';
import { SwitchConfig } from './validators/switch.js';
type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
type UndefinedKeys<T> = {
    [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];
type UndefinedToOptional<T> = Prettify<{
    [K in Exclude<keyof T, UndefinedKeys<T>>]: T[K];
} & {
    [K in UndefinedKeys<T>]?: T[K];
}>;
type CustomValidator<T> = ((value: T, context: ValidationContext) => boolean | Promise<boolean>) | {
    validator: (value: T, context: ValidationContext) => boolean | Promise<boolean>;
    message?: string;
};
type ValidatorConfig<VCollection> = {
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
type InferSchemaType<T extends Schema<any, any>> = T extends Schema<infer U, any> ? U : never;
export declare class Schema<TOutput, TInput = TOutput> implements StandardSchemaV1<TInput, TOutput> {
    protected validators: Array<{
        name: string;
        validator: ValidatorFunction<TOutput>;
        args: any[];
    }>;
    protected preparations: Array<{
        name: string;
        preparation: PreparationFunction;
        args: any[];
    }>;
    protected customPreparations: PreparationFunction[];
    protected transformations: Array<{
        name: string;
        transformation: TransformationFunction;
        args: any[];
    }>;
    protected customTransformations: TransformationFunction[];
    protected customValidators: CustomValidator<TOutput>[];
    private dataType;
    config: Record<string, unknown>;
    label: string;
    readonly "~standard": StandardSchemaV1.Props<TInput, TOutput>;
    constructor(dataType: string, config?: Record<string, unknown>);
    _prepare(context: ValidationContext): Promise<any>;
    _validate(value: any, context: ValidationContext): Promise<void>;
    _transform(value: any, context: ValidationContext): Promise<TOutput>;
    parse(data: TInput, ctx?: any): Promise<TOutput>;
    safeParse(data: TInput, ctx?: any): Promise<SafeParseResult<TOutput>>;
    optional(): Schema<TOutput | undefined, TInput | undefined>;
    nullable(): Schema<TOutput | null, TInput | null>;
    asKey(): Schema<string | number, TInput>;
}
type SObjectProperties = Record<string, Schema<any, any>>;
type InferSObjectType<P extends SObjectProperties> = Prettify<UndefinedToOptional<{
    [K in keyof P]: InferSchemaType<P[K]>;
}>>;
declare class ObjectSchema<P extends SObjectProperties, T = InferSObjectType<P>> extends Schema<T> {
    constructor(config: ValidatorConfig<any> & {
        validate?: {
            properties?: P;
        };
    });
    private getProperties;
    partial(): ObjectSchema<P, Partial<T>>;
    pick<K extends keyof P & keyof T>(keys: K[]): ObjectSchema<Pick<P, K>, Pick<T, K>>;
    omit<K extends keyof P>(keys: K[]): ObjectSchema<Omit<P, K>, Omit<T, K>>;
    extend<E extends SObjectProperties>(extension: E): ObjectSchema<P & E, T & InferSObjectType<E>>;
}
type Builder = {
    [P in Exclude<(typeof plugins)[number], {
        dataType: "switch" | "object";
    }> as P["dataType"]]: (config?: ValidatorConfig<any>) => Schema<P extends SValidator<infer TOutput, any> ? TOutput : never, P extends SValidator<any, infer TInput> ? TInput : never>;
} & {
    object<P extends SObjectProperties>(config: ValidatorConfig<any> & {
        validate?: {
            properties?: P;
        };
    }): ObjectSchema<P, InferSObjectType<P>>;
    switch(config: SwitchConfig): Schema<any>;
};
export declare const s: Builder;
export declare namespace s {
    type infer<T extends Schema<any, any>> = T extends Schema<infer U, any> ? U : never;
}
export {};
