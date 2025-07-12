import { definePlugin } from "../types.js";

export const nanPlugin = definePlugin<number>({
  dataType: "nan",
  validate: {
    identity: {
      validator: (value: unknown): value is number => Number.isNaN(value),
      message: (ctx) => `Value must be NaN.`,
    },
  },
});
