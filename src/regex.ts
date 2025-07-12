import { regex as zodRegex } from "./zod-regex";

/**
 * A collection of regular expressions for string validation.
 *
 * @see `zod-regex.ts` for the original Zod regexes.
 * @see https://github.com/ulid/spec
 */
export const regex = {
  ...zodRegex,
  /**
   * ULID v7, with millisecond precision.
   *
   * @see https://github.com/ulid/spec
   * @see https://github.com/fpotter/ulid-v7
   */
  ulidV7: /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/,
};
