import { definePlugin } from "../types.js";

export const bigintPlugin = definePlugin<bigint>({
  dataType: "bigint",
  prepare: {
    coerce: (value: unknown, [enabled]: [boolean?]) => {
      if (enabled === false) {
        return value;
      }

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        try {
          return BigInt(value);
        } catch {
          return value;
        }
      }

      return value;
    },
  },
  validate: {
    identity: {
      validator: (value: unknown): value is bigint => typeof value === "bigint",
      message: (ctx) =>
        `Invalid type. Expected bigint, received ${typeof ctx.value}.`,
    },
    gt: {
      validator: (value: bigint, [gt]: [bigint]) => value > gt,
      message: (ctx) => `${ctx.label} must be greater than ${ctx.args[0]}n.`,
    },
    gte: {
      validator: (value: bigint, [gte]: [bigint]) => value >= gte,
      message: (ctx) =>
        `${ctx.label} must be greater than or equal to ${ctx.args[0]}n.`,
    },
    lt: {
      validator: (value: bigint, [lt]: [bigint]) => value < lt,
      message: (ctx) => `${ctx.label} must be less than ${ctx.args[0]}n.`,
    },
    lte: {
      validator: (value: bigint, [lte]: [bigint]) => value <= lte,
      message: (ctx) =>
        `${ctx.label} must be less than or equal to ${ctx.args[0]}n.`,
    },
    positive: {
      validator: (value: bigint) => value > 0n,
      message: (ctx) => `${ctx.label} must be positive.`,
    },
    negative: {
      validator: (value: bigint) => value < 0n,
      message: (ctx) => `${ctx.label} must be negative.`,
    },
    multipleOf: {
      validator: (value: bigint, [multipleOf]: [bigint]) =>
        value % multipleOf === 0n,
      message: (ctx) => `${ctx.label} must be a multiple of ${ctx.args[0]}n.`,
    },
  },
});
