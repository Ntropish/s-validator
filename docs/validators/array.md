# `s.array()`

The `array` validator checks if a value is an array and can validate its contents and properties.

## Usage

You create an array schema by passing the element schema as the first argument to `s.array()`.

```typescript
import { s } from "s-validator";

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

You can provide a configuration object as the second argument to `s.array()` for additional validation rules. All rules are placed within the `validate` object.

### Length Validation

- `length: number`: Checks if the array has an exact number of elements.
- `minLength: number`: Checks if the array has at least a minimum number of elements.
- `maxLength: number`: Checks if the array has at most a maximum number of elements.
- `nonEmpty: true`: A shorthand for `minLength: 1`.

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
- `unique: true`: Checks if all elements in the array are unique.

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
