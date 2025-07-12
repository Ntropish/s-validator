# s-val

**A simple, lightweight, and type-safe validation library for TypeScript and JavaScript.**

`s-val` provides a straightforward and declarative API for building validation schemas, ensuring your data conforms to the required structure and types without any external dependencies.

## Features

- **Zero Dependencies:** Lightweight and easy to integrate.
- **Type-Safe:** Full TypeScript support for excellent autocompletion and error checking.
- **Declarative API:** Build complex schemas with simple, chainable validators.
- **Async First:** All validation is asynchronous, supporting custom async validators out of the box.
- **Extensible:** Easily add your own custom validators.

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

// 1. Define a schema
const userSchema = s.object({
  properties: {
    name: s.string({ minLength: 3 }),
    email: s.string({ email: true }),
    age: s.number({ min: 18, optional: true }),
  },
});

// 2. Validate your data
async function validateUser(data: unknown) {
  try {
    const user = await userSchema.parse(data);
    console.log("User is valid:", user);
  } catch (error) {
    console.error("Validation failed:", error.issues);
  }
}

// Passes
validateUser({ name: "John Doe", email: "john@example.com" });

// Fails
validateUser({ name: "Jo", email: "invalid-email" });
```

## Documentation

For a complete guide to all features and validators, check out the **[full documentation](./docs/index.md)**.
