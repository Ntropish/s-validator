import { definePlugin, type ValidatorDefinition } from "./types.js";

type Class = new (...args: any[]) => any;

export const instanceofPlugin = definePlugin<any>({
  dataType: "instanceof",
  validate: {
    identity: {
      validator: (
        value: unknown,
        [constructor]: [Class | undefined]
      ): value is any => {
        if (!constructor) return false;
        return value instanceof constructor;
      },
      message: (ctx) => {
        const constructorName = (ctx.args[0] as Class)?.name || "Unknown";
        return `Value must be an instance of ${constructorName}.`;
      },
    },
  },
});
