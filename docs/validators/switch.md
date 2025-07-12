# Switch Validator

The `s.switch()` validator provides a way to dynamically choose which schema to use for validation based on the value of a property in the object being validated. This is a powerful tool for handling discriminated unions or any situation where the validation logic depends on the data itself.

## Usage

`s.switch()` takes three arguments:

1.  `keyFn`: A function that receives the `ValidationContext` and returns a `string` or `number`. This key is used to look up the appropriate schema from the `schemas` map. The context contains the `value` being validated, its `path`, and the `rootData`.
2.  `schemas`: An object (or map) where keys are the `string` or `number` values that can be returned by `keyFn`, and values are the corresponding `s-val` schemas to use for validation.
3.  `defaultSchema` (optional): A schema to use if the key returned by `keyFn` does not exist in the `schemas` map.

### Example

Here is an example of validating a list of different event types, similar to the `s.union()` example, but using `s.switch()` for more direct, key-based validation.

```typescript
import { s } from "s-val";

const eventSchema = s.switch(
  (ctx) => ctx.value.type, // 1. The key function
  {
    // 2. The schemas map
    click: s.object({
      properties: {
        type: s.literal("click"),
        x: s.number(),
        y: s.number(),
      },
    }),
    keypress: s.object({
      properties: {
        type: s.literal("keypress"),
        key: s.string(),
      },
    }),
  },
  // 3. Optional default schema
  s.object({
    properties: {
      type: s.string(),
    },
  })
);

// Valid click event
await eventSchema.parse({
  type: "click",
  x: 100,
  y: 200,
}); // ✅

// Valid keypress event
await eventSchema.parse({
  type: "keypress",
  key: "Enter",
}); // ✅

// An event type not in the schemas map will use the default schema
await eventSchema.parse({
  type: "mouseover",
}); // ✅ (passes against the default schema)

// Invalid click event (fails the 'click' schema)
await eventSchema.parse({
  type: "click",
  x: "100", // x should be a number
}); // ❌
```

## `s.switch()` vs `s.union()`

- Use `s.union()` when a value can be one of several distinct, unrelated types (e.g., `string | number`).
- Use `s.switch()` when you have a discriminated union, where a specific property on an object determines which shape the rest of the object should have. `s.switch()` is generally more efficient and provides clearer error messages in these cases.
