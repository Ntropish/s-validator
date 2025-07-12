/**
 * A collection of regular expressions for string validation.
 *
 * @see `zod-regex.ts` for the original Zod regexes.
 * @see https://github.com/ulid/spec
 */
export declare const regex: {
    cuid2: RegExp;
    /**
     * ULID v7, with millisecond precision.
     *
     * @see https://github.com/ulid/spec
     * @see https://github.com/fpotter/ulid-v7
     */
    uuidV7: RegExp;
    cuid: RegExp;
    ulid: RegExp;
    email: RegExp;
    uuid: RegExp;
    emoji: RegExp;
    ipv4: RegExp;
    cidrv4: RegExp;
    ipv6: RegExp;
    cidrv6: RegExp;
    base64: RegExp;
    base64url: RegExp;
    isoDate: RegExp;
    isoTime: RegExp;
    isoDateTime: RegExp;
    isoDuration: RegExp;
    hexColor: RegExp;
    semver: RegExp;
    url: RegExp;
};
