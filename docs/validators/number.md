# Number Validator

The `number` validator checks if a value is a number. It provides several properties for more specific numeric validations.

## Preparation

### `coerce`

A common use case is receiving numeric data as strings (e.g., from query parameters or form inputs). By setting `coerce: true` in the `prepare` object, you can automatically convert strings to numbers before validation.

- **Type**: `boolean`
- **Default**: `false`

```typescript
import { s } from "s-val";

const schema = s.number({
  prepare: {
    coerce: true, // "18" -> 18
  },
  validate: {
    integer: true,
    min: 18,
  },
});

await schema.parse("25"); // ✅ -> 25
await schema.parse(18); // ✅ -> 18
await schema.parse("17"); // ❌ (fails min validation)
```

## Validation

All validation rules are passed inside a `validate` object in the configuration.

- `min: number`: Checks if the number is greater than or equal to the value.
- `max: number`: Checks if the number is less than or equal to the value.
- `gt: number`: Checks if the number is strictly greater than the value.
- `lt: number`: Checks if the number is strictly less than the value.
- `integer: boolean`: Checks if the number is an integer.
- `positive: boolean`: Checks if the number is positive (> 0).
- `negative: boolean`: Checks if the number is negative (< 0).
- `multipleOf: number`: Checks if the number is a multiple of the value.
- `even: boolean`: Checks if the number is even.
- `odd: boolean`: Checks if the number is odd.

**Range Example:**

```typescript
// Number must be between 5 and 10 (inclusive)
const schema = s.number({ validate: { min: 5, max: 10 } });

await schema.parse(7); // ✅
await schema.parse(5); // ✅
await schema.parse(4); // ❌
await schema.parse(11); // ❌
```

**Type Example:**

```typescript
// Number must be a positive integer
const schema = s.number({ validate: { positive: true, integer: true } });

await schema.parse(10); // ✅
await schema.parse(-10); // ❌
await schema.parse(10.5); // ❌
```

## Transformation

Use the `transform` object to modify the number _after_ it has been validated.

**Example: Formatting as a currency string**

```typescript
const priceSchema = s.number({
  prepare: { coerce: true },
  validate: {
    min: 0,
  },
  transform: {
    custom: (value) =>
      value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
  },
});

const price = await priceSchema.parse("49.99");
console.log(price); // -> "$49.99"
```
