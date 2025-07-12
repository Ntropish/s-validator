import { PreparationFunction, TransformationFunction, ValidatorFunction, ValidationContext, SafeParseResult, CustomValidator } from '../types.js';
import { StandardSchemaV1 } from '../standard-schema.js';
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
    protected dataType: string;
    config: Record<string, unknown>;
    label: string;
    readonly "~standard": StandardSchemaV1.Props<TInput, TOutput>;
    constructor(dataType: string, config?: Record<string, unknown>);
    _prepare(context: ValidationContext): Promise<any>;
    _validate(value: any, context: ValidationContext): Promise<any>;
    _transform(value: any, context: ValidationContext): Promise<TOutput>;
    parse(data: TInput, ctx?: any): Promise<TOutput>;
    safeParse(data: TInput, ctx?: any): Promise<SafeParseResult<TOutput>>;
    optional(): Schema<TOutput | undefined, TInput | undefined>;
    nullable(): Schema<TOutput | null, TInput | null>;
    asKey(): Schema<string | number, TInput>;
}
