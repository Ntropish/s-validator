# Record Validator

The `record` validator is used to check objects where you want to validate all keys and values against specific schemas, but you don't know the exact keys ahead of time. This is useful for dictionaries, lookup tables, or any object used as a key-value store.

It is similar to the `s.map()` validator, but it works with plain JavaScript objects instead of `Map` instances.

## Usage

You create a record schema by providing two arguments:

1. A schema for the keys. This must be a schema that resolves to `string` or `number`.
2. A schema for the values. This can be any `s-val` schema.

```typescript
import { s } from "s-val";

// A record where keys are strings and values are numbers.
const scoresSchema = s.record(s.string(), s.number());

const scores = {
  player1: 100,
  player2: 85,
  player3: 92,
};

await scoresSchema.parse(scores); // ✅
```

## Key Validation

The key schema is enforced for every key in the object.

```typescript
// A record where keys must be valid UUIDs.
const userRolesSchema = s.record(s.string({ uuid: true }), s.string());

const validRoles = {
  "f47ac10b-58cc-4372-a567-0e02b2c3d479": "admin",
  "a47ac10b-58cc-4372-a567-0e02b2c3d480": "editor",
};

await userRolesSchema.parse(validRoles); // ✅

const invalidRoles = {
  "f47ac10b-58cc-4372-a567-0e02b2c3d479": "admin",
  "not-a-uuid": "viewer", // This key is invalid
};

await userRolesSchema.parse(invalidRoles); // ❌
```

> **Note:** Even if you use numbers as keys in your object literal, they are converted to strings during runtime. Therefore, your key schema should typically be a `s.string()` validator (e.g., `s.string().numeric()`).

## Value Validation

The value schema is enforced for every value in the object. The value schema can be as simple or as complex as you need.

```typescript
// A record where values must be objects matching a specific shape.
const userSchema = s.object({
  properties: {
    name: s.string(),
    email: s.string({ email: true }),
  },
});

const usersByIdSchema = s.record(s.string({ uuid: true }), userSchema);

const validUsers = {
  "f47ac10b-58cc-4372-a567-0e02b2c3d479": {
    name: "John Doe",
    email: "john@example.com",
  },
};

await usersByIdSchema.parse(validUsers); // ✅

const invalidUsers = {
  "a47ac10b-58cc-4372-a567-0e02b2c3d480": {
    name: "Jane Doe",
    email: "not-a-valid-email", // This nested property is invalid
  },
};

await usersByIdSchema.parse(invalidUsers); // ❌
```
