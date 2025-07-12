# Union Validator

The `s.union()` validator allows you to combine multiple schemas into one. The validation will pass if the input value matches **at least one** of the provided schemas. This is useful for accepting values that can have different types or shapes.

## Usage

The `s.union()` function takes an array of schemas as its only argument.

### Union of Primitive Types

You can use `s.union()` to allow a value to be one of several primitive types.

```typescript
import { s } from "s-val";

const stringOrNumber = s.union([s.string(), s.number()]);

await stringOrNumber.parse("hello"); // ✅
await stringOrNumber.parse(123); // ✅
await stringOrNumber.parse(true); // ❌
```

### Union of Object Schemas

`s.union()` is particularly powerful for handling objects that can have different shapes, often based on a discriminating key.

```typescript
import { s } from "s-val";

const eventSchema = s.union([
  s.object().properties({
    type: s.string().oneOf(["click"]),
    x: s.number(),
    y: s.number(),
  }),
  s.object().properties({
    type: s.string().oneOf(["keypress"]),
    key: s.string(),
  }),
]);

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

// Invalid event (wrong type for keypress)
await eventSchema.parse({
  type: "keypress",
  key: 123,
}); // ❌

// Invalid event (unknown type)
await eventSchema.parse({
  type: "mouseover",
}); // ❌
```

## Error Handling

If a value fails to validate against all of the schemas in the union, the `ValidationError` will contain a collection of all the issues encountered while trying each schema. This can be useful for debugging why a value failed validation.
