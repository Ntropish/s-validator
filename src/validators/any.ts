import { Plugin } from "./types.js";

export const anyPlugin: Plugin = {
  any: [
    {
      validate: {
        identity: {
          validator: (value: unknown): value is any => true,
          message: (ctx) => "Invalid value.", // This should ideally never be reached
        },
      },
    },
  ],
};
