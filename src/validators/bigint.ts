import { definePlugin } from "../types.js";

export const bigintPlugin = definePlugin<bigint>({
  dataType: "bigint",
  prepare: {
    coerce: (value: unknown, [enabled]: [boolean?]) => {
      if (enabled === false) {
        return value;
      }

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        try {
          return BigInt(value);
        } catch {
          return value;
        }
      }

      return value;
    },
  },
  validate: {
    identity: {
      validator: (value: unknown): value is bigint => typeof value === "bigint",
      message: (ctx) =>
        `Invalid type. Expected bigint, received ${typeof ctx.value}.`,
    },
  },
});
