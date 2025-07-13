# `SetSchema`

The `SetSchema` is used to validate that a value is a JavaScript `Set` and that its elements conform to a specified schema. It is the schema that powers the `s.set()` validator.

## Usage

You will typically use the `s.set()` builder function to create a `SetSchema`. You must specify the schema for the elements of the set in the `validate.ofType` configuration property.

```typescript
import { s } from "s-validator";

// A set of numbers
const numberSetSchema = s.set({
  validate: {
    ofType: s.number(),
  },
});
```

## Key Features

`SetSchema` inherits from the base `Schema` class and provides the following key behavior:

### Element Validation

The `SetSchema` iterates over the input `Set` and validates each of its elements against the schema provided in `ofType`. If any element is invalid, the entire validation fails.

### Type Inference

The schema correctly infers the output type as a `Set` of the `ofType` schema's inferred type.

```typescript
import { s } from "s-validator";

const schema = s.set({
  validate: {
    ofType: s.string(),
  },
});

// The type of `result` is inferred as `Set<string>`
const result = await schema.parse(new Set(["a", "b", "c"]));
```
