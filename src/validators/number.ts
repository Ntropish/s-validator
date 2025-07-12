import { definePlugin } from "../types.js";

export const numberPlugin = definePlugin<number>({
  dataType: "number",
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
      validator: (value: unknown): value is number => typeof value === "number",
      message: (ctx) =>
        `Invalid type. Expected number, received ${typeof ctx.value}.`,
    },
    min: {
      validator: (value, [min]) => value >= min,
      message: (ctx) => `${ctx.label} must be at least ${ctx.args[0]}.`,
    },
    max: {
      validator: (value, [max]) => value <= max,
      message: (ctx) => `${ctx.label} must be at most ${ctx.args[0]}.`,
    },
    gt: {
      validator: (value, [num]) => value > num,
      message: (ctx) => `${ctx.label} must be greater than ${ctx.args[0]}.`,
    },
    gte: {
      validator: (value, [num]) => value >= num,
      message: (ctx) =>
        `${ctx.label} must be greater than or equal to ${ctx.args[0]}.`,
    },
    lt: {
      validator: (value, [num]) => value < num,
      message: (ctx) => `${ctx.label} must be less than ${ctx.args[0]}.`,
    },
    lte: {
      validator: (value, [num]) => value <= num,
      message: (ctx) =>
        `${ctx.label} must be less than or equal to ${ctx.args[0]}.`,
    },
    range: {
      validator: (value, [[min, max]]) => value >= min && value <= max,
      message: (ctx) =>
        `${ctx.label} must be between ${ctx.args[0][0]} and ${ctx.args[0][1]}.`,
    },
    exclusiveRange: {
      validator: (value, [[min, max]]) => value > min && value < max,
      message: (ctx) =>
        `${ctx.label} must be strictly between ${ctx.args[0][0]} and ${ctx.args[0][1]}.`,
    },
    multipleOf: {
      validator: (value, [multipleOf]) => value % multipleOf === 0,
      message: (ctx) => `${ctx.label} must be a multiple of ${ctx.args[0]}.`,
    },
    integer: {
      validator: (value, [enabled]) => {
        if (enabled === undefined || enabled === false) return true;
        return Number.isInteger(value);
      },
      message: (ctx) => `${ctx.label} must be an integer.`,
    },
    safe: {
      validator: (value, [enabled]) => {
        if (enabled === undefined || enabled === false) return true;
        return Number.isSafeInteger(value);
      },
      message: (ctx) => `${ctx.label} must be a safe integer.`,
    },
    positive: {
      validator: (value) => value > 0,
      message: (ctx) => `${ctx.label} must be positive.`,
    },
    negative: {
      validator: (value) => value < 0,
      message: (ctx) => `${ctx.label} must be negative.`,
    },
  },
});
