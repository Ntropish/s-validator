# Date Validator

The `date` validator checks if a value is a JavaScript `Date` object.

## Usage

You can pass a configuration object to `s.date()` to specify validation rules.

```typescript
import { s } from "s-val";

const schema = s.date({
  min: new Date("2023-01-01"),
});

await schema.parse(new Date("2023-01-02")); // ✅
await schema.parse("2023-01-01"); // ❌ (not a Date object)
await schema.parse(new Date("2022-12-31")); // ❌ (before min date)
```

## Configuration Properties

### `min`

Checks if the date is on or after the specified date.

- **Type**: `Date`
- **Example**: `s.date({ min: new Date("2023-01-01") })`

### `max`

Checks if the date is on or before the specified date.

- **Type**: `Date`
- **Example**: `s.date({ max: new Date("2023-01-01") })`
