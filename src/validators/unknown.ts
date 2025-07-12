import { Plugin } from "./types.js";

export const unknownPlugin: Plugin = {
  unknown: [
    {
      validate: {
        identity: {
          validator: (value: unknown): value is unknown => true,
          message: (ctx) => "Invalid value.",
        },
      },
    },
  ],
};
