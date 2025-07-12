import { definePlugin } from "../types.js";

const truthyStrings = new Set(["true", "1", "yes", "on", "y", "enabled"]);
const falsyStrings = new Set(["false", "0", "no", "off", "n", "disabled"]);

export const booleanPlugin = definePlugin<boolean>({
  dataType: "boolean",
  prepare: {
    coerce: (value: unknown, [enabled]: [boolean?]) => {
      if (enabled === false) {
        return value;
      }
      return !!value;
    },
    stringBool: (value: unknown, [enabled]: [boolean?]) => {
      if (enabled === false) {
        return value;
      }
      if (typeof value === "string") {
        const lowerValue = value.toLowerCase();
        if (truthyStrings.has(lowerValue)) {
          return true;
        }
        if (falsyStrings.has(lowerValue)) {
          return false;
        }
      }
      return value;
    },
  },
  validate: {
    identity: {
      validator: (value: unknown): value is boolean =>
        typeof value === "boolean",
      message: (ctx) =>
        `Invalid type. Expected boolean, received ${typeof ctx.value}.`,
    },
    required: {
      validator: (value: boolean) => typeof value === "boolean",
      message: (ctx) => `${ctx.label} is required.`,
    },
  },
});
