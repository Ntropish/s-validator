import { Plugin } from "./types.js";

export const mapPlugin: Plugin = {
  map: [
    {
      validate: {
        identity: {
          validator: (value: unknown): value is Map<any, any> =>
            value instanceof Map,
          message: (ctx) =>
            `Invalid type. Expected Map, received ${typeof ctx.value}.`,
        },
      },
    },
  ],
};
