# `s.map()`

The `map` validator checks if a value is a `Map` and validates its keys and values against provided schemas.

## Usage

You pass the key schema and value schema as the first and second arguments to `s.map()`.

```typescript
import { s } from "s-validator";

const schema = s.map(
  s.string({ validate: { minLength: 2 } }),
  s.number({ validate: { positive: true } })
);

const validMap = new Map([
  ["aa", 1],
  ["bb", 2],
]);
await schema.parse(validMap); // ✅

const invalidKeyMap = new Map([["a", 1]]); // Key "a" is too short
await schema.parse(invalidKeyMap); // ❌

const invalidValueMap = new Map([["bb", -2]]); // Value -2 is not positive
await schema.parse(invalidValueMap); // ❌
```

## Validation Rules

You can provide a configuration object as the third argument for additional validation rules.

### Size Validation

- `minSize: number`: Checks if the map has at least a minimum number of entries.
- `maxSize: number`: Checks if the map has at most a maximum number of entries.
- `size: number`: Checks if the map has an exact number of entries.
- `nonEmpty: true`: A shorthand for `minSize: 1`.

**Example:**

```typescript
const schema = s.map(s.string(), s.number(), {
  validate: {
    minSize: 2,
    maxSize: 3,
  },
});

await schema.parse(
  new Map([
    ["a", 1],
    ["b", 2],
  ])
); // ✅
await schema.parse(new Map([["a", 1]])); // ❌ (too small)
await schema.parse(
  new Map([
    ["a", 1],
    ["b", 2],
    ["c", 3],
    ["d", 4],
  ])
); // ❌ (too large)
```
