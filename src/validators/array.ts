import {
  SchemaValidatorMap,
  ValidatorCollection,
  SchemaLike,
} from "./types.js";

export const arrayValidatorMap = {
  array: {
    identity: (value: unknown): value is any[] => Array.isArray(value),
    length: (value: any[], [length]: [number]) => value.length === length,
    minLength: (value: any[], [minLength]: [number]) =>
      value.length >= minLength,
    maxLength: (value: any[], [maxLength]: [number]) =>
      value.length <= maxLength,
    nonEmpty: (value: any[]) => value.length > 0,
    contains: (value: any[], [element]: [any]) => value.includes(element),
    excludes: (value: any[], [element]: [any]) => !value.includes(element),
    unique: (value: any[]) => new Set(value).size === value.length,

    ofType: async (value: any[], [schema]: [SchemaLike], context) => {
      for (const [i, item] of value.entries()) {
        const result = await (schema as SchemaLike).safeParse({
          ...context,
          path: [...context.path, i],
          value: item,
        });
        if (result.status === "error") {
          return false;
        }
      }
      return true;
    },

    items: async (value: any[], [schemas]: [SchemaLike[]], context) => {
      if (value.length !== schemas.length) {
        return false; // Tuple length must match schema array length
      }
      for (const [i, schema] of (schemas as SchemaLike[]).entries()) {
        const result = await schema.safeParse({
          ...context,
          path: [...context.path, i],
          value: value[i],
        });
        if (result.status === "error") {
          return false;
        }
      }
      return true;
    },
  } satisfies ValidatorCollection<any[]>,
} as const;
