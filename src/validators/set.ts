import { definePlugin } from "../types.js";

export const setPlugin = definePlugin<Set<any>>({
  dataType: "set",
  validate: {
    identity: {
      validator: (value: unknown): value is Set<any> => value instanceof Set,
      message: (ctx) =>
        `Invalid type. Expected set, received ${typeof ctx.value}.`,
    },
  },
});
