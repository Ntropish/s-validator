import { SchemaLike } from './types.js';
export declare const objectValidatorMap: {
    readonly object: {
        identity: (value: unknown) => value is object;
        properties: (value: object, [properties]: [Record<string, SchemaLike>], context: import('./types.js').ValidationContext) => boolean;
    };
};
