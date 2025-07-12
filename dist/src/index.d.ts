import { plugins } from './validator-map.js';
import { StandardSchemaV1 } from './standard-schema.js';
import { Validator as SValidator, ValidatorFunction, ValidationContext, SafeParseResult, PreparationFunction, TransformationFunction } from './validators/types.js';
import { SwitchConfig } from './validators/switch.js';
type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
type CustomValidator<T> = ((value: T, context: ValidationContext) => boolean | Promise<boolean>) | {
    validator: (value: T, context: ValidationContext) => boolean | Promise<boolean>;
    message?: string;
};
type ValidatorConfig<VCollection> = {
    optional?: boolean;
    nullable?: boolean;
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
type Builder = {
    [P in Exclude<(typeof plugins)[number], {
        dataType: "switch";
    }> as P["dataType"]]: (config?: ValidatorConfig<any>) => Schema<P extends SValidator<infer TOutput, any> ? TOutput : never, P extends SValidator<any, infer TInput> ? TInput : never>;
} & {
    switch(config: SwitchConfig): Schema<any>;
};
export declare const s: Builder;
export declare namespace s {
    type infer<T extends Schema<any, any>> = T extends Schema<infer U, any> ? U : never;
}
export {};
