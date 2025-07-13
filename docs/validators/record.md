# Record Validator

The `record` validator is used to check objects where you want to validate all keys and values against specific schemas, but you don't know the exact keys ahead of time. This is useful for dictionaries, lookup tables, or any object used as a key-value store.

It is similar to `s.map()`, but it works with plain JavaScript objects instead of `Map` instances.

## Usage

You create a record schema by passing the key schema and the value schema as arguments to the `s.record()` method.

1.  The first argument is the schema for the keys. This must be a schema that validates to a `string` or `number`.
2.  The second argument is the schema for the values. This can be any `s-validator` schema.

```typescript
import { s } from "s-validator";

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

The key schema is enforced for every key in the object. For example, you can require all keys to be UUIDs.

```typescript
// A record where keys must be valid UUIDs.
const userRolesSchema = s.record(
  s.string({ validate: { uuid: true } }),
  s.string()
);

const validRoles = {
  "f47ac10b-58cc-4372-a567-0e02b2c3d479": "admin",
  "a47ac10b-58cc-4372-a567-0e02b2c3d480": "editor",
};

await userRolesSchema.parse(validRoles); // ✅

const invalidRoles = {
  "f47ac10b-58cc-4372-a567-0e02b2c3d479": "admin",
  "not-a-uuid": "viewer", // This key is invalid
};

try {
  await userRolesSchema.parse(invalidRoles); // ❌
} catch (e) {
  console.log(e.issues);
}
```

> **Note:** JavaScript object keys are implicitly converted to strings. If you use `s.number()` as the key schema, `s-validator` will correctly validate the stringified number.

## Value Validation

The value schema is enforced for every value in the object. The value schema can be as simple or as complex as you need.

```typescript
// A record where values must be objects matching a specific shape.
const userSchema = s.object({
  validate: {
    properties: {
      name: s.string(),
      email: s.string({ validate: { email: true } }),
    },
  },
});

const usersByIdSchema = s.record(
  s.string({ validate: { uuid: true } }),
  userSchema
);

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

try {
  await usersByIdSchema.parse(invalidUsers); // ❌
} catch (e) {
  console.log(e.issues);
}
```
