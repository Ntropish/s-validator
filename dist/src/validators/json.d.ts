import { SchemaLike } from './types.js';
export declare const jsonValidatorMap: {
    readonly json: {
        identity: (value: unknown) => value is string;
        schema: (value: string, [schema]: [SchemaLike], context: import('./types.js').ValidationContext) => boolean;
    };
};
