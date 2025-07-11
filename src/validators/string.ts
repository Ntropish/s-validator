import { ValidatorCollection, SchemaLike } from "./types.js";

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const stringValidatorMap = {
  string: {
    identity: (value: unknown): value is string => typeof value === "string",
    length: (value: string, [length]: [number]) => value.length === length,
    minLength: (value: string, [minLength]: [number]) =>
      value.length >= minLength,
    maxLength: (value: string, [maxLength]: [number]) =>
      value.length <= maxLength,
    range: (value: string, [[min, max]]: [[number, number]]) =>
      value.length >= min && value.length <= max,
    exclusiveRange: (value: string, [[min, max]]: [[number, number]]) =>
      value.length > min && value.length < max,
    pattern: (value: string, [pattern]: [RegExp]) => pattern.test(value),
    oneOf: (value: string, [options]: [string[]]) => options.includes(value),
    json: (value: string, [schema]: [SchemaLike], context) => {
      try {
        const parsed = JSON.parse(value);
        schema.parse({ ...context, value: parsed });
        return true;
      } catch (e) {
        return false;
      }
    },
    email: (
      value: string,
      [config = true]: [
        (
          | boolean
          | { allowed?: (string | RegExp)[]; denied?: (string | RegExp)[] }
        )?
      ]
    ) => {
      if (!EMAIL_REGEX.test(value)) {
        return false;
      }
      if (typeof config === "boolean") {
        return config;
      }

      const domain = value.substring(value.lastIndexOf("@") + 1);

      if (config.denied) {
        for (const rule of config.denied) {
          if (rule instanceof RegExp ? rule.test(domain) : rule === domain) {
            return false;
          }
        }
      }

      if (config.allowed) {
        for (const rule of config.allowed) {
          if (rule instanceof RegExp ? rule.test(domain) : rule === domain) {
            return true;
          }
        }
        return false;
      }

      return true;
    },
  } satisfies ValidatorCollection<string>,
} as const;
