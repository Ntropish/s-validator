import { definePlugin } from "./types.js";

export const anyPlugin = definePlugin<any>({
  dataType: "any",
  validate: {
    identity: {
      validator: (value: unknown): value is any => true,
      message: (ctx) => "Invalid value.", // This should ideally never be reached
    },
  },
});
