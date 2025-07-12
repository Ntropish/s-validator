import { type Plugin, type ValidatorDefinition } from "./types.js";

type Class = new (...args: any[]) => any;

export const instanceofPlugin: Plugin = {
  instanceof: [
    {
      validate: {
        identity: {
          validator: (value: unknown, [constructor]: [Class | undefined]) => {
            if (!constructor) return false;
            return value instanceof constructor;
          },
          message: (ctx) => {
            const constructorName = ctx.args[0]?.name || "Unknown";
            return `Value must be an instance of ${constructorName}.`;
          },
        },
      } as Record<string, ValidatorDefinition<any>>,
    },
  ],
};
