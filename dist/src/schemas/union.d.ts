import { Schema } from './schema.js';
import { InferSchemaType, ValidationContext, ValidatorConfig } from '../types.js';
export declare class UnionSchema<TVariants extends readonly [Schema<any, any>, ...Schema<any, any>[]], TOutput = InferSchemaType<TVariants[number]>, TInput = TOutput> extends Schema<TOutput, TInput> {
    private variants;
    constructor(variants: TVariants, config: ValidatorConfig<TOutput>);
    _validate(value: any, context: ValidationContext): Promise<any>;
    _transform(value: any, context: ValidationContext): Promise<TOutput>;
}
