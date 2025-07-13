# s-val: Simple, Type-Safe Validation

Welcome to the official documentation for `s-val`, a lightweight, zero-dependency, and type-safe validation library for TypeScript and JavaScript.

## Core Concepts: The Three-Phase Pipeline

`s-val` operates on a unique **three-phase validation pipeline** for every schema. This ensures a predictable and powerful validation process. When you call `parse()` or `safeParse()`, the data goes through these steps in order for the entire schema tree:

1.  **Preparation (`prepare`)**: The raw input is recursively traversed, and preparation functions are run. This is the ideal place to **coerce** data into the correct type _before_ validation, such as converting a date string to a `Date` object or trimming whitespace from a string.

2.  **Validation (`validate`)**: The prepared data is recursively validated against the rules defined in your schema (e.g., `minLength`, `min`, `email`). If any validation fails, the process stops and throws an error that is caught by the top-level `parse` or `safeParse` call.

3.  **Transformation (`transform`)**: After the data has been successfully validated, it is recursively transformed into its final output shape. This is useful for **formatting** data, such as adding a prefix, converting a `Date` object back to a formatted string, or creating a computed property.

## Parsing Data

Once you have a schema, you can validate your data using one of two methods: `parse()` or `safeParse()`. All validation is **asynchronous**.

### `parse()`

The `parse` method is best used when you expect validation to succeed but want an error thrown if it doesn't. It returns the fully prepared, validated, and transformed data. If validation fails at any point, it throws a `ValidationError`.

```typescript
import { s } from "s-val";

const schema = s.string({
  prepare: { trim: true },
  validate: { minLength: 5 },
});

try {
  const user = await schema.parse("  valid input  ");
  console.log(user); // Output: "valid input"
} catch (error) {
  // This block will execute if validation fails.
  console.error("Validation failed:", error.issues);
}
```

### `safeParse()`

If you prefer not to use `try...catch` blocks, `safeParse` is for you. It never throws an error. Instead, it returns a result object containing either the successfully parsed data or a `ValidationError` instance.

```typescript
const result = await schema.safeParse("  no  ");

if (result.status === "success") {
  console.log("Success:", result.data);
} else {
  // result.status === "error"
  console.error("Failure:", result.error.issues);
  // Output:
  // [ { path: [], message: 'Your input must contain at least 5 characters.' } ]
}
```

## Customizing Error Messages

You can easily override the default error messages for any validator by providing a `messages` object in the schema configuration.

```typescript
const nameSchema = s.string({
  validate: {
    minLength: 5,
    maxLength: 100,
  },
  messages: {
    minLength: "Name is too short! Please use at least 5 characters.",
    maxLength: "Name is too long! Maximum length is 100 characters.",
  },
});

const result = await nameSchema.safeParse("abc");

if (result.status === "error") {
  console.log(result.error.issues[0].message);
  // Output: "Name is too short! Please use at least 5 characters."
}
```

### Dynamic Messages with Functions

For more advanced use cases, you can provide a function to the `messages` object. This function will receive a context object containing the `value` being validated, the `label` for the schema, the validation `args`, and more. This allows you to create dynamic error messages.

```typescript
import { s } from "s-val";

const ageSchema = s.number({
  label: "User age",
  validate: {
    min: 18,
  },
  messages: {
    min: (ctx) =>
      `Error for ${ctx.label}: the value ${ctx.value} is too low. ` +
      `Minimum is ${ctx.args[0]}.`,
  },
});

const result = await ageSchema.safeParse(16);

if (result.status === "error") {
  console.log(result.error.issues[0].message);
  // Output: "Error for User age: the value 16 is too low. Minimum is 18."
}
```

## Modifiers

You can modify any schema to allow for `undefined` or `null` values using the `optional` and `nullable` configuration properties.

### `optional`

To allow a value to be `undefined`, set `optional: true` in its schema definition. In an object, this means the property can be missing entirely.

```typescript
const schema = s.object({
  validate: {
    properties: {
      name: s.string(),
      bio: s.string({ optional: true }),
    },
  },
});

// Both of these will pass
await schema.parse({ name: "John" });
await schema.parse({ name: "John", bio: "A developer." });
```

### `nullable`

To allow a value to be `null`, set `nullable: true` in its schema definition.

```typescript
const schema = s.object({
  validate: {
    properties: {
      name: s.string(),
      bio: s.string({ nullable: true }),
    },
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
- `s.array()`: Validates that a value is an array where each item matches a given schema.
- `s.union()`: Validates that a value matches one of several possible schemas.
- `s.switch()`: Validates against different schemas based on a key property.

## Type Inference with `s.infer`

`s-val` can automatically infer a static TypeScript type from your schema. This is extremely useful for ensuring that your code remains type-safe after validation, without needing to manually define the types yourself.

To infer the type, use the `s.infer<T>` utility, where `T` is the `typeof` your schema.

```typescript
import { s } from "s-val";

const userSchema = s.object({
  validate: {
    properties: {
      name: s.string(),
      age: s.number(),
      isAdmin: s.boolean({ optional: true }),
      // Correct syntax for an array of strings
      tags: s.array(s.string(), { nullable: true }),
    },
  },
});

// Infer the type from the schema
type User = s.infer<typeof userSchema>;

// The inferred 'User' type is equivalent to:
// {
//   name: string;
//   age: number;
//   isAdmin?: boolean;
//   tags: string[] | null;
// }

// You can now use this type in your code
const processUser = (user: User) => {
  console.log(user.name);
};

const validUserData = {
  name: "Jane Doe",
  age: 42,
  tags: ["admin", "editor"],
};

const validatedUser = await userSchema.parse(validUserData);
processUser(validatedUser); // This is type-safe!
```

## Next Steps

Now that you have the basics, you can dive deeper into the specific validators or learn how to create your own.

- **[Validator Reference](./validators/index.md):** Detailed API for all built-in validators.
- **[Extensibility](./extensibility.md):** Learn how to create custom validators.

## Advanced Topics

### Interoperability with `StandardSchemaV1`

`s-val` schemas are compatible with the [`StandardSchemaV1` interface](https://github.com/alexreardon/standard-schemas). This allows you to use `s-val` schemas with other libraries and tools that adhere to the same standard.

The compatibility interface is available under the `~standard` property on any schema instance.

```typescript
import { s } from "s-val";
import type { StandardSchemaV1 } from "s-val/dist/standard-schema";

const userSchema = s.object({
  validate: {
    properties: { name: s.string() },
  },
});

// Access the standard interface
const standardUserSchema: StandardSchemaV1<any, any> = userSchema["~standard"];

// You can now use this with any tool that expects a StandardSchemaV1
const result = await standardUserSchema.validate({ name: "John" });

if (!("issues" in result)) {
  console.log("Success:", result.value);
} else {
  console.error("Failure:", result.issues);
}
```
