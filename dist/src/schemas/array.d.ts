import { Schema } from './schema.js';
import { InferSchemaType, ValidatorConfig, ValidationContext } from '../types.js';
export declare class ArraySchema<T extends Schema<any, any>, TOutput = InferSchemaType<T>[], TInput = TOutput> extends Schema<TOutput, TInput> {
    private itemSchema;
    constructor(itemSchema: T, config: ValidatorConfig<TOutput>);
    _prepare(context: ValidationContext): Promise<any>;
    _validate(value: any[], context: ValidationContext): Promise<any[]>;
    _transform(value: any[], context: ValidationContext): Promise<any>;
}
