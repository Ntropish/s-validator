import { Schema } from '../index.js';
export interface SchemaLike {
    readonly config: Record<string, unknown>;
    parse(context: ValidationContext): any;
}
export type ValidationContext = {
    /** The original, top-level data passed to `parse()`. */
    readonly rootData: any;
    /** The path from the root to the current value being validated. */
    readonly path: ReadonlyArray<string | number>;
    /** The value at the current path. */
    readonly value: any;
};
export type ValidatorFunction<T = any, Args extends any[] = any[]> = (value: T, args: Args, context: ValidationContext) => boolean;
export type ValidatorCollection<T = any> = {
    identity: ValidatorFunction<unknown, []>;
} & {
    [validatorName: string]: ValidatorFunction<T, any[]>;
};
export type SchemaValidatorMap = {
    [dataType: string]: ValidatorCollection<any>;
};
export { Schema };
