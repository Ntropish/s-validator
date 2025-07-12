import { Schema, ValidationContext } from './types.js';
type SwitchCase<T> = Record<string | number, Schema<T>>;
type SwitchDefault<T> = Schema<T> | undefined;
export type SwitchConfig = {
    select: (context: ValidationContext) => string | number;
    cases: SwitchCase<any>;
    default?: SwitchDefault<any>;
};
export declare const switchPlugin: import('./types.js').Validator<any, unknown>;
export {};
