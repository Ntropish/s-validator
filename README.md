# s-val

**A simple, lightweight, and type-safe validation library for TypeScript and JavaScript.**

`s-val` provides a straightforward and declarative API for building validation schemas, ensuring your data conforms to the required structure and types without any external dependencies.

![cover image](./cover.webp)

## Features

- **Zero Dependencies:** Lightweight and easy to integrate.
- **Type-Safe:** Full TypeScript support for excellent autocompletion and error checking.
- **Declarative API:** Build complex schemas with a simple and clear configuration-object API.
- **Async First:** All validation is asynchronous, supporting custom async validators out of the box.
- **Powerful Architecture:** A unique three-phase validation pipeline allows for complex data preparation and transformation.
- **Extensible:** A powerful plugin system allows for easy custom extensions.

## Core Concepts

`s-val` operates on a unique **three-phase validation pipeline** for every schema, ensuring a predictable and powerful validation process. When you call `parse()` or `safeParse()`, the data goes through these steps in order:

1.  **Preparation (`_prepare`)**: The raw input is recursively traversed, and preparation functions are run. This is ideal for coercing data into the correct type _before_ validation, such as converting a date string to a `Date` object or trimming a string.

2.  **Validation (`_validate`)**: The prepared data is recursively validated against the rules defined in your schema (e.g., `minLength`, `min`, `email`). If any validation fails, the process stops and throws an error.

3.  **Transformation (`_transform`)**: After the data has been successfully validated, it is recursively transformed into its final output shape. This is useful for formatting data, such as adding a prefix or converting a `Date` object back to a formatted string.

## Getting Started

First, install `s-val` in your project:

```bash
npm install s-val
# or
yarn add s-val
# or
pnpm add s-val
```

Next, define a schema and use it to validate your data.

```typescript
import { s } from "s-val";

// 1. Define a schema with preparations and transformations
const userSchema = s.object({
  properties: {
    username: s.string({
      validate: { minLength: 3 },
      transform: { custom: [(v) => `@${v}`] }, // Add a transformation
    }),
    email: s.string({
      prepare: { trim: true }, // Add a preparation
      validate: { email: true },
    }),
    createdAt: s.date({
      prepare: { coerce: true }, // Coerce string/number to Date
      optional: true,
    }),
  },
});

// 2. Validate your data with `parse` or `safeParse`

// `parse` throws an error on failure
async function validateUser(data: unknown) {
  try {
    const user = await userSchema.parse(data);
    console.log("User is valid:", user);
    // User is valid: { username: '@johndoe', email: 'john@example.com' }
  } catch (error) {
    console.error("Validation failed:", error.issues);
  }
}

// `safeParse` returns a result object
async function safeValidateUser(data: unknown) {
  const result = await userSchema.safeParse(data);
  if (result.status === "success") {
    console.log("User is valid:", result.data);
  } else {
    console.error("Validation failed:", result.error.issues);
  }
}

// Example Usage
validateUser({
  username: "johndoe",
  email: "  john@example.com  ", // Note the extra spaces
});

safeValidateUser({
  username: "Jo", // Too short
  email: "invalid-email",
});
```

## Documentation

For a complete guide to all features and validators, check out the **[full documentation](./docs/index.md)**.
