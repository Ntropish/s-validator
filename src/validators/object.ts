import { ValidationError } from "./types.js";
import { ValidationContext } from "./types.js";

export const objectValidators = {
  identity: (value: unknown): value is Record<string, any> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  },
};
