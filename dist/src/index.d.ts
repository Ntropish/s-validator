import { ValidationContext, SchemaValidatorMap } from './validators/types.js';
type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
type InferConfig<Func> = Func extends (value: any, args: [infer ConfigType], ...rest: any[]) => any ? ConfigType : never;
type ValidatorConfig<VCollection> = Prettify<{
    [K in keyof Omit<VCollection, "identity">]?: InferConfig<VCollection[K]>;
} & {
    optional?: boolean;
    nullable?: boolean;
    messages?: Prettify<{
        [K in keyof Omit<VCollection, "identity" | "messages">]?: string;
    } & {
        identity?: string;
    }>;
}>;
type InferDataType<VCollection> = VCollection extends {
    identity: (value: any) => value is infer T;
} ? T : unknown;
export declare class Schema<T> {
    private validators;
    private dataType;
    config: Record<string, unknown>;
    constructor(dataType: string, config: Record<string, unknown>, validatorMap: SchemaValidatorMap);
    parse(data: T): T;
    parse(context: ValidationContext): T;
    protected _parse(context: ValidationContext): T;
}
type CreateSchemaBuilder<TMap extends SchemaValidatorMap> = {
    [K in keyof TMap]: (config?: ValidatorConfig<TMap[K]>) => Schema<InferDataType<TMap[K]>>;
} & {
    switch<TKey extends string | number, TSchema extends Schema<any>>(keyFn: (context: ValidationContext) => TKey, schemas: Record<TKey, TSchema>, defaultSchema?: TSchema): TSchema;
};
export declare function createSchemaBuilder<TMap extends SchemaValidatorMap>(validatorMap: TMap): CreateSchemaBuilder<TMap>;
export declare const s: CreateSchemaBuilder<{
    readonly string: {
        identity: (value: unknown) => value is string;
        length: (value: string, [length]: [number]) => boolean;
        minLength: (value: string, [minLength]: [number]) => boolean;
        maxLength: (value: string, [maxLength]: [number]) => boolean;
        range: (value: string, [[min, max]]: [[number, number]]) => boolean;
        exclusiveRange: (value: string, [[min, max]]: [[number, number]]) => boolean;
        pattern: (value: string, [pattern]: [RegExp]) => boolean;
        oneOf: (value: string, [options]: [string[]]) => boolean;
    };
} & {
    readonly number: {
        identity: (value: unknown) => value is number;
        min: (value: number, [min]: [number]) => boolean;
        max: (value: number, [max]: [number]) => boolean;
        range: (value: number, [[min, max]]: [[number, number]]) => boolean;
        exclusiveRange: (value: number, [[min, max]]: [[number, number]]) => boolean;
        integer: (value: number) => boolean;
        positive: (value: number) => boolean;
        negative: (value: number) => boolean;
        zero: (value: number) => value is 0;
        float: (value: number) => boolean;
        multipleOf: (value: number, [multipleOf]: [number]) => boolean;
        even: (value: number) => boolean;
        odd: (value: number) => boolean;
    };
} & {
    readonly boolean: {
        identity: (value: unknown) => value is boolean;
        required: (value: boolean) => boolean;
    };
} & {
    readonly array: {
        identity: (value: unknown) => value is any[];
        length: (value: any[], [length]: [number]) => boolean;
        minLength: (value: any[], [minLength]: [number]) => boolean;
        maxLength: (value: any[], [maxLength]: [number]) => boolean;
        nonEmpty: (value: any[]) => boolean;
        contains: (value: any[], [element]: [any]) => boolean;
        excludes: (value: any[], [element]: [any]) => boolean;
        unique: (value: any[]) => boolean;
        ofType: (value: any[], [schema]: [import('./validators/types.js').SchemaLike], context: ValidationContext) => true;
        items: (value: any[], [schemas]: [import('./validators/types.js').SchemaLike[]], context: ValidationContext) => boolean;
    };
} & {
    readonly object: {
        identity: (value: unknown) => value is object;
        properties: (value: object, [properties]: [Record<string, import('./validators/types.js').SchemaLike>], context: ValidationContext) => boolean;
    };
} & {
    readonly email: {
        identity: (value: unknown) => value is string;
        domain: (email: string, [config]: [{
            allow?: (string | RegExp)[];
            deny?: (string | RegExp)[];
        }]) => boolean;
    };
} & {
    readonly json: {
        identity: (value: unknown) => value is string;
        schema: (value: string, [schema]: [import('./validators/types.js').SchemaLike], context: ValidationContext) => boolean;
    };
}>;
export {};
