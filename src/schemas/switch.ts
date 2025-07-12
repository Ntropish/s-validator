import { ValidationContext, ValidationError } from "../types";
import { Schema } from "./schema.js";

export type SwitchConfig = {
  select: (context: ValidationContext) => any;
  cases: Record<string | number, Schema<any, any>>;
  default?: Schema<any, any>;
  failOnNoMatch?: boolean;
};

export class SwitchSchema extends Schema<any> {
  constructor(config: SwitchConfig) {
    super("switch", config);
  }

  private selectCase(context: ValidationContext): Schema<any, any> | undefined {
    const {
      select,
      cases,
      default: defaultSchema,
    } = this.config as SwitchConfig;

    if (!select || !cases) {
      return undefined;
    }

    const key = select(context);
    return cases[key] || defaultSchema;
  }

  async _prepare(context: ValidationContext): Promise<any> {
    const preparedValue = await super._prepare(context);
    const caseSchema = this.selectCase({ ...context, value: preparedValue });

    if (caseSchema) {
      return await caseSchema._prepare({ ...context, value: preparedValue });
    }

    return preparedValue;
  }

  async _validate(value: any, context: ValidationContext): Promise<any> {
    const caseSchema = this.selectCase(context);

    if (caseSchema) {
      return await caseSchema._validate(value, context);
    }

    const { failOnNoMatch } = this.config as SwitchConfig;
    if (failOnNoMatch) {
      const key = (this.config as SwitchConfig).select(context);
      throw new ValidationError([
        {
          path: context.path,
          message: `No case matched for key "${key}" and no default was provided.`,
        },
      ]);
    }

    return value;
  }

  async _transform(value: any, context: ValidationContext): Promise<any> {
    const transformedValue = await super._transform(value, context);
    const caseSchema = this.selectCase({ ...context, value: transformedValue });

    if (caseSchema) {
      return await caseSchema._transform(transformedValue, context);
    }

    return transformedValue;
  }
}
