import { Plugin } from "./types.js";

export const neverPlugin: Plugin = {
  never: [
    {
      validate: {
        identity: {
          validator: (value: unknown): value is never => false,
          message: (ctx) => `Value must be of type never.`,
        },
      },
    },
  ],
};
