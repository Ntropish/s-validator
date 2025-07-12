# Literal Validator

The `literal` validator checks if a value is strictly equal to a specific primitive value.

## Usage

You can use `s.literal()` to ensure a value is an exact string, number, boolean, or null.

```typescript
import { s } from "s-val";

// Check for a specific string
const statusSchema = s.literal("success");
statusSchema.parse("success"); // ✅
statusSchema.parse("error"); // ❌

// Check for a specific number
const versionSchema = s.literal(2);
versionSchema.parse(2); // ✅
versionSchema.parse(3); // ❌

// Check for a specific boolean
const trueSchema = s.literal(true);
trueSchema.parse(true); // ✅
trueSchema.parse(false); // ❌
```

This is especially useful for creating discriminated unions.

```typescript
const eventSchema = s.union([
  s.object({
    properties: { type: s.literal("click"), x: s.number(), y: s.number() },
  }),
  s.object({
    properties: { type: s.literal("keypress"), key: s.string() },
  }),
]);
```
