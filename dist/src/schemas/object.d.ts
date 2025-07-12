import { Schema } from './schema.js';
import { SObjectProperties, InferSObjectType, ValidatorConfig, ValidationContext } from '../types.js';
export declare class ObjectSchema<P extends SObjectProperties, T = InferSObjectType<P>> extends Schema<T> {
    constructor(config: ValidatorConfig<any> & {
        validate?: {
            properties?: P;
        };
    });
    _prepare(context: ValidationContext): Promise<any>;
    _validate(value: Record<string, any>, context: ValidationContext): Promise<any>;
    _transform(value: Record<string, any>, context: ValidationContext): Promise<any>;
    private getProperties;
    partial(): ObjectSchema<P, Partial<T>>;
    pick<K extends keyof P & keyof T>(keys: K[]): ObjectSchema<Pick<P, K>, Pick<T, K>>;
    omit<K extends keyof P>(keys: K[]): ObjectSchema<Omit<P, K>, Omit<T, K>>;
    extend<E extends SObjectProperties>(extension: E): ObjectSchema<P & E, T & InferSObjectType<E>>;
}
