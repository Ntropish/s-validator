# Date Validator

The `date` validator checks if a value is a JavaScript `Date` object.

## Preparation

### `coerce`

The most common use case for the date validator is to accept date strings or numbers (timestamps) and convert them into `Date` objects. By setting `coerce: true` in the `prepare` object, you can enable this automatic conversion.

- **Type**: `boolean`
- **Default**: `false`

```typescript
import { s } from "s-val";

const eventSchema = s.date({
  prepare: { coerce: true }, // "2023-01-01" -> new Date("2023-01-01")
});

// These will all be converted to Date objects and pass validation.
await eventSchema.parse("2023-01-01T00:00:00.000Z"); // ✅
await eventSchema.parse(1672531200000); // ✅ (Unix timestamp)

try {
  // This will fail because the string is not a valid date format.
  await eventSchema.parse("not-a-date"); // ❌
} catch (e) {
  console.log(e.issues);
}
```

## Validation

All validation rules are passed inside a `validate` property in the configuration object.

### `min`

Checks if the date is on or after the specified date.

- **Type**: `Date`
- **Example**: `s.date({ validate: { min: new Date("2023-01-01") } })`

### `max`

Checks if the date is on or before the specified date.

- **Type**: `Date`
- **Example**: `s.date({ validate: { max: new Date("2023-01-01") } })`

**Example with Coercion and Validation:**

```typescript
const schema = s.date({
  prepare: { coerce: true },
  validate: {
    min: new Date("2023-01-01"),
    max: new Date("2023-12-31"),
  },
});

await schema.parse("2023-06-15"); // ✅
await schema.parse("2022-12-31"); // ❌ (before min date)
await schema.parse("2024-01-01"); // ❌ (after max date)
```
