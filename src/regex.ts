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
  uuidV7:
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};
