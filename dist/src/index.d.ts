import { plugins } from './validator-map.js';
import { SwitchConfig, SwitchSchema } from './schemas/switch.js';
import { InferSchemaType, SObjectProperties, InferSObjectType, ValidatorConfig, Validator } from './types.js';
import { Schema } from './schemas/schema.js';
import { ArraySchema } from './schemas/array.js';
import { ObjectSchema } from './schemas/object.js';
import { SetSchema } from './schemas/set.js';
import { UnionSchema, UnionValidatorConfig } from './schemas/union.js';
export { SwitchSchema, Schema };
type Builder = {
    [P in Exclude<(typeof plugins)[number], {
        dataType: "switch" | "object" | "literal" | "array" | "record" | "map" | "set" | "union" | "instanceof";
    }> as P["dataType"]]: (config?: ValidatorConfig<P extends Validator<infer TOutput, any> ? TOutput : never>) => Schema<P extends Validator<infer TOutput, any> ? TOutput : never, P extends Validator<any, infer TInput> ? TInput : never>;
} & {
    array<T extends Schema<any, any>, TOutput = InferSchemaType<T>[], TInput = InferSchemaType<T>[]>(itemSchema: T, config?: ValidatorConfig<TOutput>): ArraySchema<T, TOutput, TInput>;
    object<P extends SObjectProperties, T = InferSObjectType<P>>(config: ValidatorConfig<T> & {
        validate?: {
            properties?: P;
        };
    }): ObjectSchema<P, T>;
    switch<TOutput, TInput = TOutput>(config: SwitchConfig): Schema<TOutput, TInput>;
    literal<T extends string | number | boolean | null | undefined>(value: T, config?: ValidatorConfig<T>): Schema<T>;
    record<K extends Schema<any, any>, V extends Schema<any, any>, TOutput = Record<InferSchemaType<K>, InferSchemaType<V>>, TInput = Record<InferSchemaType<K>, InferSchemaType<V>>>(keySchema: K, valueSchema: V, config?: ValidatorConfig<TOutput>): Schema<TOutput, TInput>;
    map<K extends Schema<any, any>, V extends Schema<any, any>, TOutput = Map<InferSchemaType<K>, InferSchemaType<V>>, TInput = Map<InferSchemaType<K>, InferSchemaType<V>>>(keySchema: K, valueSchema: V, config?: ValidatorConfig<TOutput>): Schema<TOutput, TInput>;
    set<T extends Schema<any, any>, TOutput = Set<InferSchemaType<T>>, TInput = Set<InferSchemaType<T>>>(config?: ValidatorConfig<TOutput> & {
        validate?: {
            ofType?: T;
        };
    }): SetSchema<T, TOutput, TInput>;
    union<T extends readonly [Schema<any, any>, ...Schema<any, any>[]], TOutput = InferSchemaType<T[number]>, TInput = InferSchemaType<T[number]>>(config: UnionValidatorConfig<T, TOutput>): UnionSchema<T, TOutput, TInput>;
    instanceof<T>(constructor: new (...args: any[]) => T, config?: ValidatorConfig<T>): Schema<T>;
    lazy<T extends Schema<any, any>>(resolver: () => T): T;
};
export declare const s: Builder;
export declare namespace s {
    type infer<T extends Schema<any, any>> = T extends Schema<infer U, any> ? U : never;
}
