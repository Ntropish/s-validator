import { Schema } from './schema.js';
import { InferSchemaType, ValidationContext } from '../types.js';
export declare class SetSchema<TValue extends Schema<any, any>, TOutput = Set<InferSchemaType<TValue>>> extends Schema<Set<InferSchemaType<TValue>>, TOutput> {
    protected valueSchema: TValue;
    constructor(itemSchema: TValue, config?: Record<string, unknown>);
    _prepare(context: ValidationContext): Promise<any>;
    _validate(value: Set<any>, context: ValidationContext): Promise<any>;
    _transform(value: Set<any>, context: ValidationContext): Promise<Set<InferSchemaType<TValue>>>;
}
