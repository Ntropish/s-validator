# `s.set()`

The `set` validator checks if a value is a `Set` and validates its elements against a provided schema.

## Usage

You create a `set` schema by passing a configuration object to `s.set()`. The schema for the set's elements must be specified in the `validate.ofType` property.

```typescript
import { s } from "s-validator";

// A set where all items must be strings with a length of at least 3.
const tagsSchema = s.set({
  validate: {
    ofType: s.string({ validate: { minLength: 3 } }),
  },
});

const tags = new Set(["typescript", "react", "css"]);
await tagsSchema.parse(tags); // ✅

const invalidTags = new Set(["ts", "react"]); // "ts" is too short
await tagsSchema.parse(invalidTags); // ❌
```

## Validation Rules

The following validation rules can be added to the `validate` object in the configuration.

### Size Validation

- `minSize: number`: Checks if the set has at least a minimum number of elements.
- `maxSize: number`: Checks if the set has at most a maximum number of elements.
- `size: number`: Checks if the set has an exact number of elements.
- `nonEmpty: true`: A shorthand for `minSize: 1`.

**Example:**

```typescript
const schema = s.set({
  validate: {
    ofType: s.any(),
    minSize: 2,
    maxSize: 3,
  },
});

await schema.parse(new Set([1, 2])); // ✅
await schema.parse(new Set([1])); // ❌ (too few elements)
await schema.parse(new Set([1, 2, 3, 4])); // ❌ (too many elements)
```

## Custom Messages

You can provide custom error messages for any validation rule, including the `identity` check for the set itself.

```typescript
import { s } from "s-validator";

const customSetSchema = s.set(
  s.number({
    messages: {
      identity: "All items in the set must be numbers.",
    },
  }),
  {
    messages: {
      identity: "The provided value must be a Set.",
    },
  }
);

try {
  await customSetSchema.parse(["not-a-set"]); // ❌
} catch (e) {
  console.log(e.issues);
  /*
  [
    { 
      path: [], 
      message: 'The provided value must be a Set.'
    }
  ]
  */
}
```
