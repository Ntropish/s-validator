import { ValidationContext, ValidatorConfig } from '../types';
import { Schema } from './schema.js';
export type SwitchConfig = ValidatorConfig<any> & {
    select: (context: ValidationContext) => any;
    cases: Record<string | number, Schema<any, any>>;
    default?: Schema<any, any>;
    failOnNoMatch?: boolean;
};
export declare class SwitchSchema extends Schema<any> {
    constructor(config: SwitchConfig);
    private selectCase;
    _prepare(context: ValidationContext): Promise<any>;
    _validate(value: any, context: ValidationContext): Promise<any>;
    _transform(value: any, context: ValidationContext): Promise<any>;
}
