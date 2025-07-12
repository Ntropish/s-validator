import { definePlugin } from "./types.js";

export const neverPlugin = definePlugin<never>({
  dataType: "never",
  validate: {
    identity: {
      validator: (value: unknown): value is never => false,
      message: (ctx) => `Value must be of type never.`,
    },
  },
});
