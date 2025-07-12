import { type Plugin, type ValidatorDefinition } from "./types.js";

type Literal = string | number | boolean | null | undefined;

export const literalPlugin: Plugin = {
  literal: [
    {
      validate: {
        identity: {
          validator: (value: unknown, [literal]: [Literal]) => {
            return value === literal;
          },
          message: (ctx) =>
            `Invalid literal value. Expected ${JSON.stringify(
              ctx.args[0]
            )}, received ${JSON.stringify(ctx.value)}`,
        },
      } as Record<string, ValidatorDefinition<any>>,
    },
  ],
};
