import { definePlugin } from "./types.js";

type Literal = string | number | boolean | null | undefined;

export const literalPlugin = definePlugin<any>({
  dataType: "literal",
  validate: {
    identity: {
      validator: (value: unknown, [literal]: [Literal]): value is any => {
        return value === literal;
      },
      message: (ctx) =>
        `Invalid literal value. Expected ${JSON.stringify(
          ctx.args[0]
        )}, received ${JSON.stringify(ctx.value)}`,
    },
  },
});
