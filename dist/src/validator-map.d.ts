export declare const validatorMap: {
    readonly string: {
        identity: (value: unknown) => value is string;
        length: (value: string, [length]: [number]) => boolean;
        minLength: (value: string, [minLength]: [number]) => boolean;
        maxLength: (value: string, [maxLength]: [number]) => boolean;
        range: (value: string, [[min, max]]: [[number, number]]) => boolean;
        exclusiveRange: (value: string, [[min, max]]: [[number, number]]) => boolean;
        pattern: (value: string, [pattern]: [RegExp]) => boolean;
        oneOf: (value: string, [options]: [string[]]) => boolean;
    };
} & {
    readonly number: {
        identity: (value: unknown) => value is number;
        min: (value: number, [min]: [number]) => boolean;
        max: (value: number, [max]: [number]) => boolean;
        range: (value: number, [[min, max]]: [[number, number]]) => boolean;
        exclusiveRange: (value: number, [[min, max]]: [[number, number]]) => boolean;
        integer: (value: number) => boolean;
        positive: (value: number) => boolean;
        negative: (value: number) => boolean;
        zero: (value: number) => value is 0;
        float: (value: number) => boolean;
        multipleOf: (value: number, [multipleOf]: [number]) => boolean;
        even: (value: number) => boolean;
        odd: (value: number) => boolean;
    };
} & {
    readonly boolean: {
        identity: (value: unknown) => value is boolean;
        required: (value: boolean) => boolean;
    };
} & {
    readonly array: {
        identity: (value: unknown) => value is any[];
        length: (value: any[], [length]: [number]) => boolean;
        minLength: (value: any[], [minLength]: [number]) => boolean;
        maxLength: (value: any[], [maxLength]: [number]) => boolean;
        nonEmpty: (value: any[]) => boolean;
        contains: (value: any[], [element]: [any]) => boolean;
        excludes: (value: any[], [element]: [any]) => boolean;
        unique: (value: any[]) => boolean;
        ofType: (value: any[], [schema]: [import('./validators/types.js').SchemaLike], context: import('./validators/types.js').ValidationContext) => true;
        items: (value: any[], [schemas]: [import('./validators/types.js').SchemaLike[]], context: import('./validators/types.js').ValidationContext) => boolean;
    };
} & {
    readonly object: {
        identity: (value: unknown) => value is object;
        properties: (value: object, [properties]: [Record<string, import('./validators/types.js').SchemaLike>], context: import('./validators/types.js').ValidationContext) => boolean;
    };
} & {
    readonly email: {
        identity: (value: unknown) => value is string;
        domain: (email: string, [config]: [{
            allow?: (string | RegExp)[];
            deny?: (string | RegExp)[];
        }]) => boolean;
    };
} & {
    readonly json: {
        identity: (value: unknown) => value is string;
        schema: (value: string, [schema]: [import('./validators/types.js').SchemaLike], context: import('./validators/types.js').ValidationContext) => boolean;
    };
};
type Intersect<T extends readonly any[]> = T extends readonly [
    infer Head,
    ...infer Tail
] ? Head & Intersect<Tail> : {};
/**
 * Merges one or more validator maps into a single validator map.
 * Later maps override validators from earlier maps when there are conflicts.
 *
 * @param maps - One or more validator maps to merge
 * @returns A new merged validator map
 */
export declare function mergeValidatorMaps<T extends readonly Record<string, any>[]>(...maps: readonly [...T]): Intersect<T>;
export {};
