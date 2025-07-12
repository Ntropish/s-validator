# Number Validator

The `number` validator checks if a value is a number. It provides several properties for more specific numeric validations.

## Usage

You can pass a configuration object to `s.number()` to specify validation rules.

```typescript
import { s } from "s-val";

// Check for a number that is an integer and at least 18
const schema = s.number({
  integer: true,
  min: 18,
});

await schema.parse(25); // ✅
await schema.parse(18); // ✅
await schema.parse(25.5); // ❌ (not an integer)
await schema.parse(17); // ❌ (less than 18)
```

## Validation Properties

All validation rules are passed inside the configuration object.

- `min: number`: Checks if the number is greater than or equal to the value.
- `max: number`: Checks if the number is less than or equal to the value.
- `gt: number`: Checks if the number is strictly greater than the value.
- `gte: number`: Checks if the number is greater than or equal to the value (alias for `min`).
- `lt: number`: Checks if the number is strictly less than the value.
- `lte: number`: Checks if the number is less than or equal to the value (alias for `max`).
- `range: [min: number, max: number]`: Checks if the number is within an inclusive range.
- `exclusiveRange: [min: number, max: number]`: Checks if the number is within an exclusive range.
- `integer: boolean`: Checks if the number is an integer.
- `positive: boolean`: Checks if the number is positive (> 0).
- `negative: boolean`: Checks if the number is negative (< 0).
- `zero: boolean`: Checks if the number is exactly 0.
- `float: boolean`: Checks if the number is a float (i.e., not an integer).
- `multipleOf: number`: Checks if the number is a multiple of the value.
- `even: boolean`: Checks if the number is even.
- `odd: boolean`: Checks if the number is odd.

### `min`

```typescript
await s.number({ min: 5 }).parse(10); // ✅
await s.number({ min: 5 }).parse(5); // ✅
await s.number({ min: 5 }).parse(4); // ❌
```

### `max`

```typescript
await s.number({ max: 5 }).parse(1); // ✅
await s.number({ max: 5 }).parse(5); // ✅
await s.number({ max: 5 }).parse(6); // ❌
```

### `gt` (greater than)

```typescript
await s.number({ gt: 5 }).parse(6); // ✅
await s.number({ gt: 5 }).parse(5); // ❌
```

### `lt` (less than)

```typescript
await s.number({ lt: 5 }).parse(4); // ✅
await s.number({ lt: 5 }).parse(5); // ❌
```

### `range`

Checks if the number is within the inclusive range `[min, max]`.

```typescript
await s.number({ range: [5, 10] }).parse(7); // ✅
await s.number({ range: [5, 10] }).parse(5); // ✅
await s.number({ range: [5, 10] }).parse(10); // ✅
await s.number({ range: [5, 10] }).parse(4); // ❌
```

### `exclusiveRange`

Checks if the number is within the exclusive range `(min, max)`.

```typescript
await s.number({ exclusiveRange: [5, 10] }).parse(7); // ✅
await s.number({ exclusiveRange: [5, 10] }).parse(5); // ❌
await s.number({ exclusiveRange: [5, 10] }).parse(10); // ❌
```

### `integer`

```typescript
await s.number({ integer: true }).parse(10); // ✅
await s.number({ integer: true }).parse(10.5); // ❌
```

### `positive`

Checks if the number is greater than 0.

```typescript
await s.number({ positive: true }).parse(1); // ✅
await s.number({ positive: true }).parse(0); // ❌
await s.number({ positive: true }).parse(-1); // ❌
```

### `negative`

Checks if the number is less than 0.

```typescript
await s.number({ negative: true }).parse(-1); // ✅
await s.number({ negative: true }).parse(0); // ❌
await s.number({ negative: true }).parse(1); // ❌
```

### `multipleOf`

```typescript
await s.number({ multipleOf: 5 }).parse(10); // ✅
await s.number({ multipleOf: 5 }).parse(7); // ❌
```

### `even` / `odd`

```typescript
await s.number({ even: true }).parse(2); // ✅
await s.number({ even: true }).parse(3); // ❌
await s.number({ odd: true }).parse(3); // ✅
await s.number({ odd: true }).parse(2); // ❌
```
