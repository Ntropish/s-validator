import { plugins } from './validator-map.js';
import { SwitchConfig, SwitchSchema } from './schemas/switch.js';
import { InferSchemaType, SObjectProperties, InferSObjectType, ValidatorConfig, Validator } from './types.js';
import { Schema } from './schemas/schema.js';
import { ArraySchema } from './schemas/array.js';
import { ObjectSchema } from './schemas/object.js';
export { SwitchSchema };
type Builder = {
    [P in Exclude<(typeof plugins)[number], {
        dataType: "switch" | "object" | "literal";
    }> as P["dataType"]]: (config?: ValidatorConfig<any>) => Schema<P extends Validator<infer TOutput, any> ? TOutput : never, P extends Validator<any, infer TInput> ? TInput : never>;
} & {
    array<T extends Schema<any, any>>(itemSchema: T, config?: ValidatorConfig<any>): ArraySchema<T, InferSchemaType<T>[]>;
    array(config?: ValidatorConfig<any>): ArraySchema<Schema<any, any>, any[]>;
    object<P extends SObjectProperties>(config: ValidatorConfig<any> & {
        validate?: {
            properties?: P;
        };
    }): ObjectSchema<P, InferSObjectType<P>>;
    switch(config: SwitchConfig): Schema<any>;
    literal(value: string | number | boolean | null | undefined): Schema<any>;
    record(keySchema: Schema<any, any>, valueSchema: Schema<any, any>): Schema<Record<any, any>>;
    map(keySchema: Schema<any, any>, valueSchema: Schema<any, any>): Schema<Map<any, any>>;
    set(itemSchema: Schema<any, any>): Schema<Set<any>>;
    instanceof(constructor: new (...args: any[]) => any): Schema<any>;
};
export declare const s: Builder;
export declare namespace s {
    type infer<T extends Schema<any, any>> = T extends Schema<infer U, any> ? U : never;
}
