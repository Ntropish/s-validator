export declare const numberValidatorMap: {
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
};
