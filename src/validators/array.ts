import { Plugin } from "./types.js";

export const arrayPlugin: Plugin = {
  array: [
    {
      validate: {
        identity: {
          validator: (value: unknown): value is any[] => Array.isArray(value),
          message: (ctx) =>
            `Invalid type. Expected array, received ${typeof ctx.value}.`,
        },
        length: {
          validator: (value: any[], [length]: [number]) =>
            value.length === length,
          message: (ctx) =>
            `${ctx.label} must contain exactly ${ctx.args[0]} items.`,
        },
        minLength: {
          validator: (value: any[], [minLength]: [number]) =>
            value.length >= minLength,
          message: (ctx) =>
            `${ctx.label} must contain at least ${ctx.args[0]} items.`,
        },
        maxLength: {
          validator: (value: any[], [maxLength]: [number]) =>
            value.length <= maxLength,
          message: (ctx) =>
            `${ctx.label} must contain at most ${ctx.args[0]} items.`,
        },
        nonEmpty: {
          validator: (value: any[]) => value.length > 0,
          message: (ctx) => `${ctx.label} must not be empty.`,
        },
        contains: {
          validator: (value: any[], [element]: [any]) =>
            value.includes(element),
          message: (ctx) =>
            `${ctx.label} must contain the element ${ctx.args[0]}.`,
        },
        excludes: {
          validator: (value: any[], [element]: [any]) =>
            !value.includes(element),
          message: (ctx) =>
            `${ctx.label} must not contain the element ${ctx.args[0]}.`,
        },
        unique: {
          validator: (value: any[]) => new Set(value).size === value.length,
          message: (ctx) => `${ctx.label} must contain unique items.`,
        },
        items: {
          validator: () => true, // Placeholder
          message: (ctx) => `Invalid item in ${ctx.label}.`, // Placeholder
        },
      },
    },
  ],
};
