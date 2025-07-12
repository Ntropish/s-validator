import { definePlugin } from "./types.js";

export const datePlugin = definePlugin<Date>({
  dataType: "date",
  prepare: {
    coerce: (value: unknown, [enabled]: [boolean?]) => {
      if (enabled === false) {
        return value;
      }
      if (value instanceof Date) {
        return value;
      }
      if (typeof value === "string" || typeof value === "number") {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      return value;
    },
  },
  validate: {
    identity: {
      validator: (value: unknown): value is Date => value instanceof Date,
      message: (ctx) =>
        `Invalid type. Expected Date, received ${typeof ctx.value}.`,
    },
    min: {
      validator: (value: Date, [minDate]: [Date]) =>
        value.getTime() >= minDate.getTime(),
      message: (ctx) =>
        `${ctx.label} must be on or after ${new Date(
          ctx.args[0]
        ).toDateString()}.`,
    },
    max: {
      validator: (value: Date, [maxDate]: [Date]) =>
        value.getTime() <= maxDate.getTime(),
      message: (ctx) =>
        `${ctx.label} must be on or before ${new Date(
          ctx.args[0]
        ).toDateString()}.`,
    },
  },
});
