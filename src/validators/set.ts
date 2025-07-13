import { definePlugin } from "../types.js";

export const setPlugin = definePlugin<Set<any>>({
  dataType: "set",
  validate: {
    identity: {
      validator: (value: unknown): value is Set<any> => value instanceof Set,
      message: (ctx) =>
        `Invalid type. Expected set, received ${typeof ctx.value}.`,
    },
    minSize: {
      validator: (value: Set<any>, [min]: [number]) => value.size >= min,
      message: (ctx) =>
        `${ctx.label} must contain at least ${ctx.args[0]} items.`,
    },
    maxSize: {
      validator: (value: Set<any>, [max]: [number]) => value.size <= max,
      message: (ctx) =>
        `${ctx.label} must contain at most ${ctx.args[0]} items.`,
    },
    size: {
      validator: (value: Set<any>, [size]: [number]) => value.size === size,
      message: (ctx) =>
        `${ctx.label} must contain exactly ${ctx.args[0]} items.`,
    },
    nonEmpty: {
      validator: (value: Set<any>) => value.size > 0,
      message: (ctx) => `${ctx.label} must not be empty.`,
    },
  },
});
