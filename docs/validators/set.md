# Set Validator

The `set` validator checks if a value is a `Set` and validates its items against a provided schema.

## Usage

You create a set schema by passing the item schema as the first argument to `s.set()`. The second argument is an optional configuration object.

- **Item Schema**: The schema to use for validating each element in the set.
- **Config Object**: An object for additional validation rules.

```typescript
import { s } from "s-validator";

// A set where all items must be strings with a length of at least 3
const tagsSchema = s.set(s.string({ validate: { minLength: 3 } }));

const tags = new Set(["typescript", "react", "css"]);
await tagsSchema.parse(tags); // ✅

const invalidTags = new Set(["ts", "react"]); // "ts" is too short

try {
  await tagsSchema.parse(invalidTags); // ❌
} catch (e) {
  console.log(e.issues);
  /*
  [
    {
      path: [ 0 ],
      message: 'String must be at least 3 characters long'
    }
  ]
  */
}
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
