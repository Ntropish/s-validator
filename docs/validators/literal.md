# Literal Validator

The `literal` validator checks if a value is strictly equal to a specific primitive value.

## Usage

You can use `s.literal()` to ensure a value is an exact string, number, boolean, or null.

```typescript
import { s } from "s-val";

// Check for a specific string
const statusSchema = s.literal("success");
await statusSchema.parse("success"); // ✅
await statusSchema.parse("error"); // ❌

// Check for a specific number
const versionSchema = s.literal(2);
await versionSchema.parse(2); // ✅
await versionSchema.parse(3); // ❌

// Check for a specific boolean
const trueSchema = s.literal(true);
await trueSchema.parse(true); // ✅
await trueSchema.parse(false); // ❌
```

This is especially useful for creating discriminated unions with `s.switch()` or `s.union()`.

```typescript
const clickEvent = s.object({
  properties: { type: s.literal("click"), x: s.number(), y: s.number() },
});

const keypressEvent = s.object({
  properties: { type: s.literal("keypress"), key: s.string() },
});

const eventSchema = s.union([clickEvent, keypressEvent]);
```
