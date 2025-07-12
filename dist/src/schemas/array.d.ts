import { Schema } from './schema.js';
import { InferSchemaType, ValidatorConfig, ValidationContext } from '../types.js';
export declare class ArraySchema<T extends Schema<any, any>, TOutput = InferSchemaType<T>[]> extends Schema<TOutput> {
    private itemSchema;
    constructor(itemSchema: T, config: ValidatorConfig<any>);
    _prepare(context: ValidationContext): Promise<any>;
    _validate(value: any[], context: ValidationContext): Promise<any[]>;
    _transform(value: any[], context: ValidationContext): Promise<any>;
}
