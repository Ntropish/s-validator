# Literal Validator

The `literal` validator checks if a value is strictly equal to a specific primitive value.

## Usage

You pass the literal value inside the `validate.identity` property of the configuration object.

```typescript
import { s } from "s-val";

// Check for a specific string
const statusSchema = s.literal({ validate: { identity: "success" } });
await statusSchema.parse("success"); // ✅
await statusSchema.parse("error"); // ❌

// Check for a specific number
const versionSchema = s.literal({ validate: { identity: 2 } });
await versionSchema.parse(2); // ✅
await versionSchema.parse(3); // ❌

// Check for a specific boolean
const trueSchema = s.literal({ validate: { identity: true } });
await trueSchema.parse(true); // ✅
await trueSchema.parse(false); // ❌
```

This is especially useful for creating discriminated unions with `s.switch()` or `s.union()`.

```typescript
const clickEvent = s.object({
  properties: {
    type: s.literal({ validate: { identity: "click" } }),
    x: s.number(),
    y: s.number(),
  },
});

const keypressEvent = s.object({
  properties: {
    type: s.literal({ validate: { identity: "keypress" } }),
    key: s.string(),
  },
});

const eventSchema = s.union([clickEvent, keypressEvent]);
```
