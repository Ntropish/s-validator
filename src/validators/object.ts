import { definePlugin } from "./types.js";

export const objectPlugin = definePlugin({
  dataType: "object",
  validate: {
    identity: {
      validator: (value: unknown): boolean => {
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        );
      },
      message: (ctx) =>
        `Invalid type. Expected object, received ${typeof ctx.value}.`,
    },
  },
});
