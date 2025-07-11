type DomainConfig = {
    allow?: (string | RegExp)[];
    deny?: (string | RegExp)[];
};
export declare const emailValidatorMap: {
    readonly email: {
        identity: (value: unknown) => value is string;
        domain: (email: string, [config]: [DomainConfig]) => boolean;
    };
};
export {};
