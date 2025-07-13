# `SwitchSchema`

The `SwitchSchema` provides a powerful way to perform conditional validation, choosing which schema to apply based on the value of a field in the input data. It is the schema that powers the `s.switch()` validator. This is particularly useful for validating discriminated unions, where a "type" field determines the shape of an object.

## Usage

You will use the `s.switch()` builder function to create a `SwitchSchema`. It takes two arguments:

1.  A `resolver` function that inspects the input data and returns the key of the schema to use.
2.  An `options` object that maps keys to their corresponding schemas.

```typescript
import { s } from "s-validator";

const shapeSchema = s.switch(
  (data) => data.type, // Resolver
  {
    // Options
    circle: s.object({
      validate: {
        properties: { type: s.literal("circle"), radius: s.number() },
      },
    }),
    square: s.object({
      validate: { properties: { type: s.literal("square"), side: s.number() } },
    }),
  }
);
```

## Key Features

`SwitchSchema` inherits from the base `Schema` class and introduces the following key behavior:

### Conditional Validation

The `resolver` function is called first with the input data. The value it returns is used as a key to look up the appropriate schema in the `options` object. The `SwitchSchema` then uses that schema to perform the actual validation.

If the `resolver` function throws an error, or if it returns a key that does not exist in the `options` object, the validation fails.

### Fallback/Default Schema

You can provide a fallback schema by using the special `s.DEFAULT` key in your `options` object. If the resolver returns a key that is not found in the `options`, the schema associated with `s.DEFAULT` will be used.

```typescript
import { s, S } from "s-validator";

const schema = s.switch((data) => data.type, {
  a: s.string(),
  b: s.number(),
  [S.DEFAULT]: s.unknown(),
});
```
