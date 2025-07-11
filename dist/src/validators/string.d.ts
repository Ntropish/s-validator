export declare const stringValidatorMap: {
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
};
