# `s.record()`

The `record` validator is used for objects where you want to validate all keys and values against specific schemas, without knowing the exact property names ahead of time. It's ideal for dictionaries or lookup tables.

## Usage

You pass the key schema and the value schema as the first and second arguments to `s.record()`.

**Important**: JavaScript object keys are always strings. Your key schema should be `s.string()` or a refinement of it (e.g., a string with a specific format).

```typescript
import { s } from "s-validator";

// A record where keys are strings and values are numbers.
const scoresSchema = s.record(s.string(), s.number());

await scoresSchema.parse({ player1: 100, player2: 85 }); // ✅

// A record where keys must be UUIDs and values are user objects.
const userSchema = s.object({
  validate: { properties: { name: s.string() } },
});
const usersByIdSchema = s.record(
  s.string({ validate: { uuid: true } }),
  userSchema
);

await usersByIdSchema.parse({
  "f47ac10b-58cc-4372-a567-0e02b2c3d479": { name: "John" },
}); // ✅

await usersByIdSchema.parse({ "not-a-uuid": { name: "Jane" } }); // ❌
```

## Validation Rules

You can provide a configuration object as the third argument for additional validation rules.

### Size Validation

- `minSize: number`: Checks if the record has at least a minimum number of properties.
- `maxSize: number`: Checks if the record has at most a maximum number of properties.
- `size: number`: Checks if the record has an exact number of properties.
- `nonEmpty: true`: A shorthand for `minSize: 1`.

**Example:**

```typescript
const schema = s.record(s.string(), s.any(), {
  validate: {
    minSize: 2,
    maxSize: 3,
  },
});

await schema.parse({ a: 1, b: 2 }); // ✅
await schema.parse({ a: 1 }); // ❌ (too few properties)
await schema.parse({ a: 1, b: 2, c: 3, d: 4 }); // ❌ (too many properties)
```
