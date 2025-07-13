# Array Validator

The `array` validator checks if a value is an array and can validate its contents and properties.

## Usage

You create an array schema by passing the item schema as the first argument to `s.array()`. The second argument is an optional configuration object for additional validation rules.

- **Item Schema**: The schema to use for validating each element in the array.
- **Config Object**: An object for validation rules like `minLength`, `maxLength`, etc.

```typescript
import { s } from "s-val";

// An array where all items must be strings.
const stringArraySchema = s.array(s.string());

await stringArraySchema.parse(["hello", "world"]); // ✅

try {
  // This fails because the second item is a number.
  await stringArraySchema.parse(["hello", 123]); // ❌
} catch (e) {
  console.log(e.issues);
}
```

## Validation Rules

All validation rules are placed within the `validate` object in the second argument.

### `items` (For Tuples)

To validate an array with a specific sequence of types (a tuple), use the `items` property. The array must have the same number of elements as the provided `schemas` array.

- **Type**: `Schema[]`
- **Example**: `s.array(s.any(), { validate: { items: [s.string(), s.number()] } })`

```typescript
// A tuple of [string, number]
const tupleSchema = s.array(s.any(), {
  validate: {
    items: [s.string(), s.number()],
  },
});

await tupleSchema.parse(["hello", 123]); // ✅
await tupleSchema.parse(["hello", "world"]); // ❌ (second item must be a number)
await tupleSchema.parse(["hello"]); // ❌ (must have exactly 2 items)
```

### Length Validation

- `length: number`: Checks if the array has an exact number of elements.
- `minLength: number`: Checks if the array has at least a minimum number of elements.
- `maxLength: number`: Checks if the array has at most a maximum number of elements.
- `nonEmpty: boolean`: A shorthand for `minLength: 1`.

**Example:**

```typescript
// An array that must contain between 2 and 4 numbers.
const schema = s.array(s.number(), {
  validate: {
    minLength: 2,
    maxLength: 4,
  },
});

await schema.parse([1, 2]); // ✅
await schema.parse([1, 2, 3, 4]); // ✅
await schema.parse([1]); // ❌
await schema.parse([1, 2, 3, 4, 5]); // ❌
```

### Content Validation

- `contains: any`: Checks if the array contains the specified element.
- `excludes: any`: Checks if the array does not contain the specified element.
- `unique: boolean`: Checks if all elements in the array are unique.

**Example:**

```typescript
const schema = s.array(s.string(), {
  validate: {
    contains: "a",
    excludes: "d",
    unique: true,
  },
});

await schema.parse(["a", "b", "c"]); // ✅
await schema.parse(["b", "c"]); // ❌ (must contain 'a')
await schema.parse(["a", "b", "d"]); // ❌ (must not contain 'd')
await schema.parse(["a", "b", "a"]); // ❌ (must be unique)
```
