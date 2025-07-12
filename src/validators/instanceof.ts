import { Plugin } from "./types.js";

export const instanceofPlugin: Plugin = {
  instanceof: [
    {
      validate: {
        identity: {
          validator: (
            value: unknown,
            args,
            context,
            schema
          ): value is object => {
            const constructorFn = (schema as any).constructorFn;
            if (!constructorFn) {
              return false;
            }
            return value instanceof constructorFn;
          },
          message: (ctx) => {
            const constructorName =
              (ctx.schema as any).constructorFn?.name || "Unknown";
            return `Value must be an instance of ${constructorName}.`;
          },
        },
      },
    },
  ],
};
