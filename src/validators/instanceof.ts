import { definePlugin } from "../types.js";

export const instanceofPlugin = definePlugin({
  dataType: "instanceof",
  validate: {
    identity: {
      validator: (
        value: unknown,
        [constructor]: [new (...args: any[]) => any]
      ) => {
        return value instanceof constructor;
      },
      message: (ctx) => {
        const constructor = ctx.args[0] as
          | (new (...args: any[]) => any)
          | undefined;
        const constructorName = constructor?.name ?? "Unknown";
        const valueName =
          ctx.value === null
            ? "null"
            : typeof ctx.value === "object"
            ? (ctx.value as object).constructor.name
            : typeof ctx.value;
        return `Invalid type. Expected instance of ${constructorName}, received ${valueName}.`;
      },
    },
  },
});
