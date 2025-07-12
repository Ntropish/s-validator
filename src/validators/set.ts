import { Plugin } from "./types.js";

export const setPlugin: Plugin = {
  set: [
    {
      validate: {
        identity: {
          validator: (value: unknown): value is Set<any> =>
            value instanceof Set,
          message: (ctx) =>
            `Invalid type. Expected Set, received ${typeof ctx.value}.`,
        },
      },
    },
  ],
};
