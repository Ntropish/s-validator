import { StandardSchemaV1 } from './standard-schema.js';
import { ValidatorFunction, ValidationContext, SchemaValidatorMap, SafeParseResult, PreparationFunction, TransformationFunction } from './validators/types.js';
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
type InferDataType<VCollection> = VCollection extends {
    identity: (value: any) => value is infer T;
} ? T : unknown;
type InferSchemaType<T extends Schema<any, any>> = T extends Schema<infer U, any> ? U : never;
type SObjectProperties = Record<string, Schema<any, any>>;
type InferSObjectType<P extends SObjectProperties> = Prettify<UndefinedToOptional<{
    [K in keyof P]: InferSchemaType<P[K]>;
}>>;
type WithLoose<T> = T & {
    [key: string]: any;
};
type SObjectOptions<P extends SObjectProperties> = ValidatorConfig<any> & {
    properties: P;
    strict?: boolean;
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
    constructor(dataType: string, config: Record<string, unknown>, validatorMap: SchemaValidatorMap, preparationMap: Record<string, any>, transformationMap: Record<string, any>);
    _prepare(context: ValidationContext): Promise<any>;
    _validate(value: any, context: ValidationContext): Promise<void>;
    _transform(value: any, context: ValidationContext): Promise<TOutput>;
    parse(data: TInput, ctx?: any): Promise<TOutput>;
    safeParse(data: TInput, ctx?: any): Promise<SafeParseResult<TOutput>>;
    optional(): Schema<TOutput | undefined, TInput | undefined>;
    nullable(): Schema<TOutput | null, TInput | null>;
    asKey(): Schema<string | number, TInput>;
}
declare class ObjectSchema<P extends SObjectProperties, T = InferSObjectType<P>> extends Schema<T> {
    constructor(config: SObjectOptions<P>);
    _prepare(context: ValidationContext): Promise<any>;
    _validate(value: any, context: ValidationContext): Promise<void>;
    _transform(value: any, context: ValidationContext): Promise<T>;
    partial(): ObjectSchema<P>;
    pick<K extends keyof P>(keys: K[]): ObjectSchema<Pick<P, K>>;
    omit<K extends keyof P>(keys: K[]): ObjectSchema<Omit<P, K>>;
    extend<P2 extends SObjectProperties>(extension: P2): ObjectSchema<P & P2>;
    strict(): ObjectSchema<P, T>;
    optional(): Schema<T | undefined, T | undefined>;
    nullable(): Schema<T | null, T | null>;
}
declare class ArraySchema<T extends Schema<any, any>> extends Schema<Array<s.infer<T>>> {
    private itemSchema;
    private tupleSchemas?;
    constructor(config: ValidatorConfig<any> & {
        validate: {
            ofType?: T;
            items?: any;
        };
    });
    _prepare(context: ValidationContext): Promise<any>;
    _validate(value: any, context: ValidationContext): Promise<void>;
    _transform(value: any, context: ValidationContext): Promise<Array<s.infer<T>>>;
    optional(): Schema<Array<s.infer<T>> | undefined>;
    nullable(): Schema<Array<s.infer<T>> | null>;
}
declare class RecordSchema<K extends Schema<string | number, any>, V extends Schema<any, any>> extends Schema<Record<s.infer<K>, s.infer<V>>> {
    private keySchema;
    private valueSchema;
    constructor(keySchema: K, valueSchema: V, config?: ValidatorConfig<any>);
    _prepare(context: ValidationContext): Promise<any>;
    _validate(value: any, context: ValidationContext): Promise<void>;
    _transform(value: any, context: ValidationContext): Promise<Record<s.infer<K>, s.infer<V>>>;
    optional(): Schema<Record<s.infer<K>, s.infer<V>> | undefined, Record<s.infer<K>, s.infer<V>> | undefined>;
    nullable(): Schema<Record<s.infer<K>, s.infer<V>> | null, Record<s.infer<K>, s.infer<V>> | null>;
}
type SwitchCase<T> = Record<string | number, Schema<T>>;
type SwitchDefault<T> = Schema<T> | undefined;
declare class SwitchSchema<TKey extends string | number, TCases extends SwitchCase<any>, TDefault extends SwitchDefault<any>> extends Schema<s.infer<TCases[TKey]> | (TDefault extends Schema<any, any> ? s.infer<TDefault> : never)> {
    private keyFn;
    private schemas;
    private defaultSchema?;
    constructor(keyFn: (context: ValidationContext) => TKey, schemas: TCases, defaultSchema?: TDefault);
    private getSchema;
    _prepare(context: ValidationContext): Promise<any>;
    _validate(value: any, context: ValidationContext): Promise<void>;
    _transform(value: any, context: ValidationContext): Promise<any>;
}
declare class MapSchema<K extends Schema<any, any>, V extends Schema<any, any>> extends Schema<Map<InferSchemaType<K>, InferSchemaType<V>>> {
    private keySchema;
    private valueSchema;
    constructor(keySchema: K, valueSchema: V);
    _prepare(context: ValidationContext): Promise<any>;
    _validate(value: any, context: ValidationContext): Promise<void>;
    _transform(value: any, context: ValidationContext): Promise<Map<InferSchemaType<K>, InferSchemaType<V>>>;
    optional(): Schema<Map<InferSchemaType<K>, InferSchemaType<V>> | undefined>;
    nullable(): Schema<Map<InferSchemaType<K>, InferSchemaType<V>> | null>;
}
declare class SetSchema<V extends Schema<any, any>> extends Schema<Set<InferSchemaType<V>>> {
    private valueSchema;
    constructor(valueSchema: V);
    _prepare(context: ValidationContext): Promise<any>;
    _validate(value: any, context: ValidationContext): Promise<void>;
    _transform(value: any, context: ValidationContext): Promise<Set<InferSchemaType<V>>>;
    optional(): Schema<Set<InferSchemaType<V>> | undefined>;
    nullable(): Schema<Set<InferSchemaType<V>> | null>;
}
declare class InstanceOfSchema<T extends new (...args: any) => any> extends Schema<InstanceType<T>> {
    private constructorFn;
    constructor(constructorFn: T);
    _validate(value: any, context: ValidationContext): Promise<void>;
    optional(): Schema<InstanceType<T> | undefined>;
    nullable(): Schema<InstanceType<T> | null>;
}
declare class UnknownSchema extends Schema<unknown, unknown> {
    constructor(config?: Record<string, unknown>);
}
declare class NeverSchema extends Schema<never, never> {
    constructor();
}
declare class LiteralSchema<T extends string | number | boolean | null | undefined> extends Schema<T> {
    private literal;
    constructor(literal: T);
    _validate(value: any, context: ValidationContext): Promise<void>;
    optional(): Schema<T | undefined>;
    nullable(): Schema<T | null>;
}
declare class UnionSchema<T extends [Schema<any, any>, ...Schema<any, any>[]]> extends Schema<InferSchemaType<T[number]>> {
    private schemas;
    constructor(schemas: T);
    _validate(value: any, context: ValidationContext): Promise<void>;
    _transform(value: any, context: ValidationContext): Promise<any>;
    optional(): Schema<InferSchemaType<T[number]> | undefined>;
    nullable(): Schema<InferSchemaType<T[number]> | null>;
}
type CreateSchemaBuilder<TMap extends SchemaValidatorMap> = {
    [K in keyof Omit<TMap, "object" | "array" | "unknown" | "never">]: <C extends ValidatorConfig<TMap[K]>>(config?: C) => Schema<InferDataType<TMap[K]>, C extends {
        prepare: any;
    } ? unknown : InferDataType<TMap[K]>>;
} & {
    object<P extends SObjectProperties>(config: SObjectOptions<P>): ObjectSchema<P, WithLoose<InferSObjectType<P>>>;
} & {
    switch<TKey extends string | number, TCases extends SwitchCase<any>, TDefault extends SwitchDefault<any>>(keyFn: (context: ValidationContext) => TKey, schemas: TCases, defaultSchema?: TDefault): SwitchSchema<TKey, TCases, TDefault>;
    record<K extends Schema<string | number, any>, V extends Schema<any, any>>(keySchema: K, valueSchema: V): RecordSchema<K, V>;
    union<T extends [Schema<any, any>, ...Schema<any, any>[]]>(schemas: T): UnionSchema<T>;
    literal<T extends string | number | boolean | null | undefined>(literal: T): LiteralSchema<T>;
    map<K extends Schema<any, any>, V extends Schema<any, any>>(keySchema: K, valueSchema: V): MapSchema<K, V>;
    set<V extends Schema<any, any>>(valueSchema: V): SetSchema<V>;
    instanceof<T extends new (...args: any) => any>(constructorFn: T): InstanceOfSchema<T>;
    array<T extends Schema<any, any>>(config: ValidatorConfig<any> & {
        validate: {
            ofType: T;
        };
    }): ArraySchema<T>;
    unknown(config?: Record<string, unknown>): UnknownSchema;
    never(): NeverSchema;
};
export declare function createSchemaBuilder<TMap extends SchemaValidatorMap>(validatorMap: TMap, preparationMap: Record<string, any>, transformationMap: Record<string, any>): CreateSchemaBuilder<TMap>;
export declare const s: CreateSchemaBuilder<SchemaValidatorMap>;
export declare namespace s {
    type infer<T extends Schema<any, any>> = T extends Schema<infer U, any> ? U : never;
}
export {};
