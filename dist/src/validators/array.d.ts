import { SchemaLike } from './types.js';
export declare const arrayValidatorMap: {
    readonly array: {
        identity: (value: unknown) => value is any[];
        length: (value: any[], [length]: [number]) => boolean;
        minLength: (value: any[], [minLength]: [number]) => boolean;
        maxLength: (value: any[], [maxLength]: [number]) => boolean;
        nonEmpty: (value: any[]) => boolean;
        contains: (value: any[], [element]: [any]) => boolean;
        excludes: (value: any[], [element]: [any]) => boolean;
        unique: (value: any[]) => boolean;
        ofType: (value: any[], [schema]: [SchemaLike], context: import('./types.js').ValidationContext) => true;
        items: (value: any[], [schemas]: [SchemaLike[]], context: import('./types.js').ValidationContext) => boolean;
    };
};
