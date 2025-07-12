import { Plugin } from "./types.js";

export const nanPlugin: Plugin = {
  nan: [
    {
      validate: {
        identity: {
          validator: (value: unknown): value is number => Number.isNaN(value),
          message: (ctx) => `Value must be NaN.`,
        },
      },
    },
  ],
};
