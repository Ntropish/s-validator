import {
  ValidatorCollection,
  SchemaLike,
  SchemaValidatorMap,
} from "./types.js";
import { regex } from "../regex.js";

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
    cuid: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled ? regex.cuid.test(value) : !regex.cuid.test(value);
    },
    cuid2: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled ? regex.cuid2.test(value) : !regex.cuid2.test(value);
    },
    ulid: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled ? regex.ulid.test(value) : !regex.ulid.test(value);
    },
    emoji: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled ? regex.emoji.test(value) : !regex.emoji.test(value);
    },
    ipv4: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled ? regex.ipv4.test(value) : !regex.ipv4.test(value);
    },
    ipv4Cidr: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled ? regex.cidrv4.test(value) : !regex.cidrv4.test(value);
    },
    ipv6: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled ? regex.ipv6.test(value) : !regex.ipv6.test(value);
    },
    ipv6Cidr: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled ? regex.cidrv6.test(value) : !regex.cidrv6.test(value);
    },
    base64: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled ? regex.base64.test(value) : !regex.base64.test(value);
    },
    base64Url: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled
        ? regex.base64url.test(value)
        : !regex.base64url.test(value);
    },
    date: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled ? regex.isoDate.test(value) : !regex.isoDate.test(value);
    },
    time: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled ? regex.isoTime.test(value) : !regex.isoTime.test(value);
    },
    duration: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled
        ? regex.isoDuration.test(value)
        : !regex.isoDuration.test(value);
    },
    hexColor: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled ? regex.hexColor.test(value) : !regex.hexColor.test(value);
    },
    semver: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled ? regex.semver.test(value) : !regex.semver.test(value);
    },
    url: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled ? regex.url.test(value) : !regex.url.test(value);
    },
    uuid: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled ? regex.uuid.test(value) : !regex.uuid.test(value);
    },
    datetime: (value: string, [enabled]: [boolean?]) => {
      if (enabled === undefined) return true;
      return enabled
        ? regex.isoDateTime.test(value)
        : !regex.isoDateTime.test(value);
    },
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
      [config]: [
        (
          | boolean
          | { allowed?: (string | RegExp)[]; denied?: (string | RegExp)[] }
        )?
      ]
    ) => {
      if (config === undefined) {
        return true;
      }
      if (typeof config === "object") {
        if (!regex.email.test(value)) {
          return false;
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
      }

      return config ? regex.email.test(value) : !regex.email.test(value);
    },
  } satisfies ValidatorCollection<string>,
} as const satisfies SchemaValidatorMap;
