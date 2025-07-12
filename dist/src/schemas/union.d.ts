import { Schema } from './schema.js';
import { InferSchemaType, ValidationContext, ValidatorConfig } from '../types.js';
export declare class UnionSchema<TVariants extends readonly [Schema<any, any>, ...Schema<any, any>[]], TOutput = InferSchemaType<TVariants[number]>> extends Schema<TOutput> {
    private variants;
    constructor(variants: TVariants, config: ValidatorConfig<any>);
    _validate(value: any, context: ValidationContext): Promise<any>;
    _transform(value: any, context: ValidationContext): Promise<TOutput>;
}
