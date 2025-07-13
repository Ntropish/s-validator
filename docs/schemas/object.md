# `ObjectSchema`

The `ObjectSchema` is used to validate JavaScript objects with a specific set of properties. It is the schema that powers the `s.object()` validator.

## Usage

You typically won't instantiate `ObjectSchema` directly. Instead, you'll use the `s.object()` builder function.

```typescript
import { s } from "s-validator";

const userSchema = s.object({
  validate: {
    properties: {
      id: s.string({ validate: { uuid: true } }),
      name: s.string({ validate: { minLength: 2 } }),
      email: s.string({ validate: { email: true }, optional: true }),
    },
  },
});
```

## Key Features

In addition to the features inherited from the base `Schema` class, `ObjectSchema` has the following key characteristics:

### Property Validation

The `ObjectSchema` iterates through the `properties` provided in the configuration and validates each one against its corresponding schema.

### Strict Mode

By default, any properties in the input object that are not defined in the schema's `properties` are stripped out during validation. You can enforce that no unknown properties are allowed by setting `strict: true` in the configuration.

```typescript
const schema = s.object({
  strict: true,
  validate: {
    properties: {
      name: s.string(),
    },
  },
});

// This will throw a ValidationError
await schema.parse({ name: "John", age: 30 });
```

### Getters as Properties

`ObjectSchema` supports defining getters within the `properties` configuration. This allows for creating computed properties that are derived from other fields in the object. The getter function receives the partially validated object as its argument.

```typescript
const schema = s.object({
  validate: {
    properties: {
      firstName: s.string(),
      lastName: s.string(),
      get fullName() {
        return s.string().transform({
          custom: (value, args, ctx) =>
            `${ctx.rootData.firstName} ${ctx.rootData.lastName}`,
        });
      },
    },
  },
});

const result = await schema.parse({
  firstName: "John",
  lastName: "Doe",
});

console.log(result.fullName); // "John Doe"
```

This feature is particularly useful for creating recursive schemas. For more details, see the documentation for [`s.object()`](../validators/object.md#recursive-schemas).
