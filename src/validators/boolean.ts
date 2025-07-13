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
  transform: {
    toString: (
      value: boolean,
      [arg]: [boolean | { true: string; false: string } | undefined]
    ) => {
      // If the transform is called, arg will be the configuration value.
      // Default to standard string conversion if arg is just `true`.
      if (typeof arg === "object") {
        return value ? arg.true : arg.false;
      }
      return String(value);
    },
    toNumber: (value: boolean) => (value ? 1 : 0),
  },
  validate: {
    identity: {
      validator: (value: unknown): value is boolean =>
        typeof value === "boolean",
      message: (ctx) =>
        `Invalid type. Expected boolean, received ${typeof ctx.value}.`,
    },
    truthy: {
      validator: (value: boolean, [enabled]: [boolean?]) => {
        if (enabled === false) return true;
        return value === true;
      },
      message: (ctx) => `${ctx.label} must be true.`,
    },
    falsy: {
      validator: (value: boolean, [enabled]: [boolean?]) => {
        if (enabled === false) return true;
        return value === false;
      },
      message: (ctx) => `${ctx.label} must be false.`,
    },
    required: {
      validator: (value: boolean) => typeof value === "boolean",
      message: (ctx) => `${ctx.label} is required.`,
    },
  },
});
