import { Plugin } from "./types.js";

export const numberPlugin: Plugin = {
  number: [
    {
      prepare: {
        coerce: (value: unknown, [enabled]: [boolean?]) => {
          if (enabled === false) {
            return value;
          }
          if (typeof value === "number") {
            return value;
          }
          if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) {
            return parseFloat(value);
          }
          return value;
        },
      },
      validate: {
        identity: {
          validator: (value: unknown): value is number =>
            typeof value === "number",
          message: (ctx) =>
            `Invalid type. Expected ${
              ctx.dataType
            }, received ${typeof ctx.value}.`,
        },
        min: {
          validator: (value: number, [min]: [number]) => value >= min,
          message: (ctx) => `${ctx.label} must be at least ${ctx.args[0]}.`,
        },
        max: {
          validator: (value: number, [max]: [number]) => value <= max,
          message: (ctx) => `${ctx.label} must be at most ${ctx.args[0]}.`,
        },
        range: {
          validator: (value: number, [[min, max]]: [[number, number]]) =>
            value >= min && value <= max,
          message: (ctx) =>
            `${ctx.label} must be between ${ctx.args[0][0]} and ${ctx.args[0][1]}.`,
        },
        exclusiveRange: {
          validator: (value: number, [[min, max]]: [[number, number]]) =>
            value > min && value < max,
          message: (ctx) =>
            `${ctx.label} must be strictly between ${ctx.args[0][0]} and ${ctx.args[0][1]}.`,
        },
        integer: {
          validator: (value: number, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled ? Number.isInteger(value) : !Number.isInteger(value);
          },
          message: (ctx) => `${ctx.label} must be an integer.`,
        },
        port: {
          validator: (value: number, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            const isPort =
              Number.isInteger(value) && value >= 0 && value <= 65535;
            return enabled ? isPort : !isPort;
          },
          message: (ctx) => `${ctx.label} must be a valid port number.`,
        },
        safe: {
          validator: (value: number, [enabled]: [boolean?]) => {
            if (enabled === undefined) return true;
            return enabled
              ? Number.isSafeInteger(value)
              : !Number.isSafeInteger(value);
          },
          message: (ctx) => `${ctx.label} must be a safe integer.`,
        },
      },
    },
  ],
};
