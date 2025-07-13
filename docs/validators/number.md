# `s.number()`

The `number` validator checks if a value is a number.

## Preparation

### `coerce`

If `coerce` is `true`, `s.number()` will attempt to convert strings into numbers before validation.

- **Type**: `boolean`
- **Example**: `s.number({ prepare: { coerce: true } })`

```typescript
import { s } from "s-validator";

const schema = s.number({ prepare: { coerce: true } });

await schema.parse("123"); // ✅ -> 123
await schema.parse("123a"); // ❌ (fails coercion)
```

## Validation Rules

All validation rules are passed inside a `validate` object.

### Comparison

- `gt: number`: Checks if the number is strictly greater than the value.
- `gte: number`: Checks if the number is greater than or equal to the value.
- `lt: number`: Checks if the number is strictly less than the value.
- `lte: number`: Checks if the number is less than or equal to the value.

**Example:**

```typescript
// Number must be greater than 5 and less than or equal to 10.
const schema = s.number({ validate: { gt: 5, lte: 10 } });

await schema.parse(7); // ✅
await schema.parse(10); // ✅
await schema.parse(5); // ❌
await schema.parse(11); // ❌
```
