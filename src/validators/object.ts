import { Plugin } from "./types.js";

export const objectPlugin: Plugin = {
  object: [
    {
      validate: {
        identity: {
          validator: (value: unknown): value is Record<string, any> =>
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value),
          message: (ctx) =>
            `Invalid type. Expected object, received ${typeof ctx.value}.`,
        },
      },
    },
  ],
};
