import { definePlugin } from "./types.js";

type Literal = string | number | boolean | null;

const isLiteral = (value: unknown): value is Literal => {
  const type = typeof value;
  return (
    type === "string" ||
    type === "number" ||
    type === "boolean" ||
    value === null
  );
};

export const literalPlugin = definePlugin({
  dataType: "literal",
  validate: {
    identity: {
      validator: isLiteral,
      message: (ctx) => `Invalid type. Expected a literal value.`,
    },
    equals: {
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
