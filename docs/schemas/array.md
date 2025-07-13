# `ArraySchema`

The `ArraySchema` is used to validate that a value is an array and that its elements conform to a specific schema. It powers the `s.array()` validator.

## Usage

You will typically use the `s.array()` builder function to create an `ArraySchema`. The first argument is the schema that each element in the array must satisfy.

```typescript
import { s } from "s-validator";

// An array of strings
const namesSchema = s.array(s.string());

// An array of objects
const usersSchema = s.array(
  s.object({
    validate: {
      properties: {
        name: s.string(),
        age: s.number(),
      },
    },
  })
);
```

## Key Features

`ArraySchema` inherits from the base `Schema` class and adds the following key behavior:

### Element Validation

The primary role of `ArraySchema` is to iterate over the input array and validate each element against the provided item schema. If any element fails validation, the entire `parse` operation will fail, and the `ValidationError` will contain detailed issues for each invalid element.

### Type Inference

`ArraySchema` correctly infers the output type as an array of the item schema's type.

```typescript
import { s } from "s-validator";

const schema = s.array(s.number());

// The type of `result` is inferred as `number[]`
const result = await schema.parse([1, 2, 3]);
```
