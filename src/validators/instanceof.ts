import { definePlugin } from "../types.js";

type Class = new (...args: any[]) => any;

export const instanceofPlugin = definePlugin({
  dataType: "instanceof",
  validate: {
    identity: {
      validator: (value: unknown): value is object => {
        return typeof value === "object" && value !== null;
      },
      message: (ctx) =>
        `Invalid type. Expected object, received ${typeof ctx.value}.`,
    },
    constructor: {
      validator: (value: unknown, [constructor]: [Class]): value is any => {
        return value instanceof constructor;
      },
      message: (ctx) => {
        const constructorName = (ctx.args[0] as Class)?.name || "Unknown";
        return `Value must be an instance of ${constructorName}.`;
      },
    },
  },
});
