import { Plugin } from "./types.js";
import { regex } from "../regex.js";

export const stringPlugin: Plugin = {
  string: [
    {
      prepare: {
        coerce: (value: unknown, [enabled]: [boolean?]) => {
          if (enabled === false) {
            return value;
          }

          if (typeof value === "string") {
            return value;
          }
          if (
            value === null ||
            value === undefined ||
            (typeof value === "object" && !value.toString)
          ) {
            return value;
          }
          return String(value);
        },
        trim: (value: unknown, [enabled]: [boolean?]) => {
          if (enabled === false) {
            return value;
          }
          return typeof value === "string" ? value.trim() : value;
        },
        toLowerCase: (value: unknown, [enabled]: [boolean?]) => {
          if (enabled === false) {
            return value;
          }
          return typeof value === "string" ? value.toLowerCase() : value;
        },
      },
      transform: {
        toUpperCase: (value: string) => value.toUpperCase(),
        toLowerCase: (value: string) => value.toLowerCase(),
        trim: (value: string) => value.trim(),
      },
      validate: {
        identity: {
          validator: (value: unknown): value is string =>
            typeof value === "string",
          message: (ctx) =>
            `Invalid type. Expected ${
              ctx.dataType
            }, received ${typeof ctx.value}.`,
        },
        length: {
          validator: (value: string, [length]: [number]) =>
            value.length === length,
          message: (ctx) =>
            `${ctx.label} must be exactly ${ctx.args[0]} characters long.`,
        },
        minLength: {
          validator: (value: string, [minLength]: [number]) =>
            value.length >= minLength,
          message: (ctx) =>
            `${ctx.label} must be at least ${ctx.args[0]} characters long.`,
        },
        maxLength: {
          validator: (value: string, [maxLength]: [number]) =>
            value.length <= maxLength,
          message: (ctx) =>
            `${ctx.label} must be at most ${ctx.args[0]} characters long.`,
        },
        range: {
          validator: (value: string, [[min, max]]: [[number, number]]) =>
            value.length >= min && value.length <= max,
          message: (ctx) =>
            `${ctx.label} must be between ${ctx.args[0][0]} and ${ctx.args[0][1]} characters long.`,
        },
        exclusiveRange: {
          validator: (value: string, [[min, max]]: [[number, number]]) =>
            value.length > min && value.length < max,
          message: (ctx) =>
            `${ctx.label} must be strictly between ${ctx.args[0][0]} and ${ctx.args[0][1]} characters long.`,
        },
        pattern: {
          validator: (value: string, [pattern]: [RegExp]) =>
            pattern.test(value),
          message: (ctx) => `${ctx.label} does not match the required pattern.`,
        },
        oneOf: {
          validator: (value: string, [options]: [string[]]) =>
            options.includes(value),
          message: (ctx) =>
            `${
              ctx.label
            } must be one of the following values: ${ctx.args[0].join(", ")}`,
        },
        cuid: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled ? regex.cuid.test(value) : !regex.cuid.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid CUID.`,
        },
        cuid2: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled ? regex.cuid2.test(value) : !regex.cuid2.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid CUID2.`,
        },
        ulid: {
          validator: (value: string, [enabled = true]: [boolean?]) => {
            return enabled ? regex.ulid.test(value) : !regex.ulid.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid ULID.`,
        },
        emoji: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled ? regex.emoji.test(value) : !regex.emoji.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid emoji.`,
        },
        ipv4: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled ? regex.ipv4.test(value) : !regex.ipv4.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid IPv4 address.`,
        },
        ipv4Cidr: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled
              ? regex.cidrv4.test(value)
              : !regex.cidrv4.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid IPv4 CIDR.`,
        },
        ipv6: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled ? regex.ipv6.test(value) : !regex.ipv6.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid IPv6 address.`,
        },
        ipv6Cidr: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled
              ? regex.cidrv6.test(value)
              : !regex.cidrv6.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid IPv6 CIDR.`,
        },
        base64: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled
              ? regex.base64.test(value)
              : !regex.base64.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid base64 string.`,
        },
        base64Url: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled
              ? regex.base64url.test(value)
              : !regex.base64url.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid base64url string.`,
        },
        date: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled
              ? regex.isoDate.test(value)
              : !regex.isoDate.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid date string.`,
        },
        time: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled
              ? regex.isoTime.test(value)
              : !regex.isoTime.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid time string.`,
        },
        duration: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled
              ? regex.isoDuration.test(value)
              : !regex.isoDuration.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid duration string.`,
        },
        hexColor: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled
              ? regex.hexColor.test(value)
              : !regex.hexColor.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid hex color.`,
        },
        semver: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled
              ? regex.semver.test(value)
              : !regex.semver.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid semver string.`,
        },
        url: {
          validator: (value: string, [enabled = true]: [boolean?]) => {
            return enabled ? regex.url.test(value) : !regex.url.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid URL.`,
        },
        uuid: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled ? regex.uuid.test(value) : !regex.uuid.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid UUID.`,
        },
        uuidV7: {
          validator: (value: string, [enabled = true]: [boolean?]) => {
            return enabled
              ? regex.uuidV7.test(value)
              : !regex.uuidV7.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid UUIDv7.`,
        },
        datetime: {
          validator: (value: string, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled
              ? regex.isoDateTime.test(value)
              : !regex.isoDateTime.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid datetime string.`,
        },
        json: {
          validator: async (value: string, [schema]) => {
            let parsed: any;
            try {
              parsed = JSON.parse(value);
            } catch (e) {
              return false;
            }
            const result = await schema.safeParse(parsed);
            return result.status === "success";
          },
          message: (ctx) => `${ctx.label} must be a valid JSON string.`,
        },
        email: {
          validator: (value: string, [config]) => {
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
                  if (
                    rule instanceof RegExp ? rule.test(domain) : rule === domain
                  ) {
                    return false;
                  }
                }
              }

              if (config.allowed) {
                for (const rule of config.allowed) {
                  if (
                    rule instanceof RegExp ? rule.test(domain) : rule === domain
                  ) {
                    return true;
                  }
                }
                return false;
              }

              return true;
            }

            return config ? regex.email.test(value) : !regex.email.test(value);
          },
          message: (ctx) => `${ctx.label} must be a valid email address.`,
        },
      },
    },
  ],
};
