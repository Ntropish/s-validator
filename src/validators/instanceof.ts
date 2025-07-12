import { Plugin } from "./types.js";

export const instanceofPlugin: Plugin = {
  instanceof: [
    {
      validate: {
        identity: {
          validator: (value: unknown): value is object =>
            typeof value === "object",
          message: (ctx) =>
            `Invalid type. Expected object, received ${typeof ctx.value}.`,
        },
      },
    },
  ],
};
