# Array Validator

The `array` validator checks if a value is an array and can validate its contents and properties.

## Usage

You can pass a configuration object to `s.array()` to specify validation rules.

```typescript
import { s } from "s-val";

// An array of strings that must contain at least one element.
const schema = s.array({
  of: s.string(),
  nonEmpty: true,
});

await schema.parse(["hello", "world"]); // ✅
await schema.parse([]); // ❌
await schema.parse(["hello", 123]); // ❌
```

## Configuration Properties

### `of`

Checks if every element in the array matches the provided `schema`.

- **Type**: `Schema`
- **Example**: `s.array({ of: s.string() })`

### `items`

Checks if the array's elements match the `schemas` provided, in order. This is used for validating tuples. The array must have the same number of elements as the `schemas` array.

- **Type**: `Schema[]`
- **Example**: `s.array({ items: [s.string(), s.number()] })`

### Length Validation

- `length: number`: Checks if the array has an exact number of elements.
- `minLength: number`: Checks if the array has at least a minimum number of elements.
- `maxLength: number`: Checks if the array has at most a maximum number of elements.
- `nonEmpty: boolean`: A shorthand for `minLength: 1`.

**Example:**

```typescript
// An array that must contain between 2 and 4 numbers.
const schema = s.array({
  of: s.number(),
  minLength: 2,
  maxLength: 4,
});

await schema.parse([1, 2]); // ✅
await schema.parse([1, 2, 3, 4]); // ✅
await schema.parse([1]); // ❌
await schema.parse([1, 2, 3, 4, 5]); // ❌
```

### Content Validation

- `contains: any | any[]`: Checks if the array contains at least one of the specified elements.
- `excludes: any | any[]`: Checks if the array does not contain any of the specified elements.
- `unique: boolean`: Checks if all elements in the array are unique.

**Example:**

```typescript
const schema = s.array({
  of: s.string(),
  contains: "a",
  excludes: "d",
  unique: true,
});

await schema.parse(["a", "b", "c"]); // ✅
await schema.parse(["b", "c"]); // ❌ (must contain 'a')
await schema.parse(["a", "b", "d"]); // ❌ (must not contain 'd')
await schema.parse(["a", "b", "a"]); // ❌ (must be unique)
```
