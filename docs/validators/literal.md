# Literal Validator

The `literal` validator checks if a value is strictly equal (`===`) to a specific primitive value.

## Usage

You pass the literal value directly to the `s.literal()` method.

```typescript
import { s } from "s-val";

// Check for a specific string
const statusSchema = s.literal("success");
await statusSchema.parse("success"); // ✅

try {
  await statusSchema.parse("error"); // ❌
} catch (e) {
  console.log(e.issues);
}

// Check for a specific number
const versionSchema = s.literal(2);
await versionSchema.parse(2); // ✅

// Check for a specific boolean
const trueSchema = s.literal(true);
await trueSchema.parse(true); // ✅
```

This is especially useful for creating discriminated unions with `s.switch()`.

```typescript
import { s } from "s-val";

const eventSchema = s.switch({
  select: (ctx) => ctx.value.type,
  cases: {
    click: s.object({
      validate: {
        properties: {
          type: s.literal("click"),
          x: s.number(),
          y: s.number(),
        },
      },
    }),
    keypress: s.object({
      validate: {
        properties: {
          type: s.literal("keypress"),
          key: s.string(),
        },
      },
    }),
  },
});
```
