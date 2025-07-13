// A recursive type to intersect all types in a tuple.
export type Intersect<T> = (T extends any ? (t: T) => void : never) extends (
  t: infer U
) => void
  ? U
  : never;

// Converts a union of types into an intersection of those types.
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

import { Schema } from "./schemas/schema.js";
import { ValidationContext } from "./types.js";

class LazySchema<T extends Schema<any, any>> extends Schema<any, any> {
  private schema: T | undefined;

  constructor(private resolver: () => T) {
    super("lazy");
  }

  private resolveSchema(): T {
    if (!this.schema) {
      this.schema = this.resolver();
    }
    return this.schema;
  }

  async _prepare(context: ValidationContext): Promise<any> {
    return this.resolveSchema()._prepare(context);
  }

  async _validate(value: any, context: ValidationContext): Promise<any> {
    return this.resolveSchema()._validate(value, context);
  }

  async _transform(value: any, context: ValidationContext): Promise<any> {
    return this.resolveSchema()._transform(value, context);
  }
}

export function lazy<T extends Schema<any, any>>(resolver: () => T): T {
  return new LazySchema(resolver) as any;
}
