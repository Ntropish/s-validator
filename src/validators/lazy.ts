import { Schema } from "../schemas/schema.js";
import { ValidationContext } from "../types.js";

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
