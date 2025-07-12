import { Schema, ValidationError, ValidationContext } from "./types.js";

export const arrayValidators = {
  identity: (value: unknown): value is any[] => {
    return Array.isArray(value);
  },

  length: (value: any[], [length]: [number]): boolean => {
    return value.length === length;
  },

  minLength: (value: any[], [minLength]: [number]): boolean => {
    return value.length >= minLength;
  },

  maxLength: (value: any[], [maxLength]: [number]): boolean => {
    return value.length <= maxLength;
  },

  nonEmpty: (value: any[]): boolean => {
    return value.length > 0;
  },

  contains: (value: any[], [element]: [any]): boolean => {
    return value.includes(element);
  },

  excludes: (value: any[], [element]: [any]): boolean => {
    return !value.includes(element);
  },

  unique: (value: any[]): boolean => {
    return new Set(value).size === value.length;
  },

  items: (
    value: any[],
    [schemas]: [Schema<any, any>[]],
    context: ValidationContext
  ): Promise<boolean> => {
    // This is a placeholder. The actual logic is now in ArraySchema._parse
    // but the validator needs to exist for it to be picked up by the constructor.
    return Promise.resolve(true);
  },
};
