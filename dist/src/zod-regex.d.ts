/**
 * @license
 * MIT License
 *
 * Copyright (c) 2022-present, Colin McDonnell
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
export declare const regex: {
    /**
     * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L446
     */
    cuid: RegExp;
    ulid: RegExp;
    /**
     * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L343
     */
    email: RegExp;
    /**
     * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L391
     */
    uuid: RegExp;
    /**
     * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L590
     *
     * @description
     * This is a simplified regex that covers the basic emoji types.
     * For a more comprehensive regex, see the original Zod implementation.
     */
    emoji: RegExp;
    /**
     * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L529
     */
    ipv4: RegExp;
    cidrv4: RegExp;
    /**
     * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L544
     */
    ipv6: RegExp;
    cidrv6: RegExp;
    base64: RegExp;
    base64url: RegExp;
    /**
     * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L619
     */
    isoDate: RegExp;
    /**
     * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L647
     */
    isoTime: RegExp;
    /**
     * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L694
     */
    isoDateTime: RegExp;
    /**
     * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L716
     */
    isoDuration: RegExp;
    /**
     * @see https://regexr.com/39s32
     */
    hexColor: RegExp;
    /**
     * @see https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
     */
    semver: RegExp;
    url: RegExp;
};
