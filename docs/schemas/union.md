# `UnionSchema`

The `UnionSchema` is used to validate that a value conforms to at least one of a given set of schemas. It powers the `s.union()` validator. This is useful for when a value can be one of several different types.

## Usage

You will typically use the `s.union()` builder function to create a `UnionSchema`. The possible schemas are passed as an array to the `validate.of` configuration property.

```typescript
import { s } from "s-validator";

const stringOrNumberSchema = s.union({
  validate: {
    of: [s.string(), s.number()],
  },
});
```

## Key Features

`UnionSchema` inherits from the base `Schema` class and has the following key behavior:

### Variant Validation

The `UnionSchema` attempts to validate the input value against each schema in the `of` array, in order. The first schema that successfully validates the value determines the result. If the value fails to validate against all of the provided schemas, the `parse` operation fails.

### Aggregated Errors

When validation fails, the thrown `ValidationError` will contain an aggregated list of all the validation issues from every schema in the union, providing a complete picture of why the input was invalid.

### Type Inference

The inferred type of a `UnionSchema` is a TypeScript union of the inferred types of all the schemas provided in the `of` array.

```typescript
import { s } from "s-validator";

const schema = s.union({
  validate: {
    of: [s.string(), s.number()],
  },
});

// The type of `result` is inferred as `string | number`
const result = await schema.parse("hello");
const result2 = await schema.parse(123);
```
