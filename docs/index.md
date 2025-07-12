# s-val: Simple, Type-Safe Validation

Welcome to the official documentation for `s-val`, a lightweight, zero-dependency, and type-safe validation library for TypeScript and JavaScript.

## Getting Started

`s-val` helps you ensure that your data has the correct structure and type. You define a "schema" for your data, and the library handles the validation.

All schemas are created using the `s` object.

```typescript
import { s } from "s-val";

// Define a schema for a user object
const userSchema = s.object({
  properties: {
    name: s.string({ minLength: 3 }),
    email: s.string({ email: true }),
    age: s.number({ min: 18 }),
  },
});
```

## Parsing Data

Once you have a schema, you can validate your data using one of two methods: `parse()` or `safeParse()`.

### `parse()`

The `parse` method validates your data and throws a `ValidationError` if the data does not conform to the schema. If validation is successful, it returns the validated data.

All validation is **asynchronous**, so you must `await` the result.

```typescript
const validUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  age: 30,
};

const invalidUser = {
  name: "Jo",
  email: "not-an-email",
  age: 17,
};

try {
  const validatedUser = await userSchema.parse(validUser);
  console.log("Validation successful:", validatedUser);
} catch (error) {
  console.error("Validation failed:", error.issues);
}

try {
  await userSchema.parse(invalidUser);
} catch (error) {
  // This will be caught
  console.error("Validation failed:", error.issues);
  // Output:
  // [
  //   { path: ['name'], message: 'Validation failed for string.minLength at path \'name\'' },
  //   { path: ['email'], message: 'Validation failed for string.email at path \'email\'' },
  //   { path: ['age'], message: 'Validation failed for number.min at path \'age\'' }
  // ]
}
```

### `safeParse()`

If you prefer not to use `try...catch` blocks, `safeParse` is for you. It never throws an error. Instead, it returns a result object containing either the successfully parsed data or a `ValidationError` instance.

```typescript
const result1 = await userSchema.safeParse(validUser);

if (result1.status === "success") {
  console.log("Validation successful:", result1.data);
}

const result2 = await userSchema.safeParse(invalidUser);

if (result2.status === "error") {
  console.error("Validation failed:", result2.error.issues);
}
```

## Modifiers

You can modify any schema to allow for `undefined` or `null` values.

### `.optional()`

To allow a value to be `undefined`, chain `.optional()` to its schema definition. In an object, this means the property can be missing entirely.

```typescript
const schema = s.object({
  properties: {
    name: s.string(),
    bio: s.string({ optional: true }),
  },
});

// Both of these will pass
await schema.parse({ name: "John" });
await schema.parse({ name: "John", bio: "A developer." });
```

### `.nullable()`

To allow a value to be `null`, chain `.nullable()` to its schema definition.

```typescript
const schema = s.object({
  properties: {
    name: s.string(),
    bio: s.string({ nullable: true }),
  },
});

// This will pass
await schema.parse({ name: "John", bio: null });

// You can also chain them!
const optionalAndNullable = s.string({ optional: true, nullable: true });
```

## Combining Schemas

You can create complex data structures by nesting schemas.

- `s.object()`: Validates that a value is an object with a specific shape.
- `s.array()`: Validates that a value is an array.
- `s.union()`: Validates that a value matches one of several possible schemas.
- `s.switch()`: Validates against different schemas based on a key property.

## Next Steps

Now that you have the basics, you can dive deeper into the specific validators or learn how to create your own.

- **[Validator Reference](./validators/index.md):** Detailed API for all built-in validators.

  - [Any](./validators/any.md)
  - [Array](./validators/array.md)
  - [Boolean](./validators/boolean.md)
  - [Date](./validators/date.md)
  - [Number](./validators/number.md)
  - [Object](./validators/object.md)
  - [String](./validators/string.md)
  - [Union](./validators/union.md)
  - [Switch](./validators/switch.md)

- **[Extensibility](./extensibility.md):** Learn how to create custom validators.
