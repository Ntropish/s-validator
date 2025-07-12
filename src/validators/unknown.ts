import { definePlugin } from "./types.js";

export const unknownPlugin = definePlugin<unknown>({
  dataType: "unknown",
  validate: {
    identity: {
      validator: (value: unknown): value is unknown => true,
      message: (ctx) => "Invalid value.",
    },
  },
});
