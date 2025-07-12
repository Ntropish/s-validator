# Object Validator

The `object` validator checks if a value is a non-null, non-array object and validates its properties against a defined shape.

## Usage

You define the shape of an object by passing a configuration object to `s.object()`. The `properties` key holds the schemas for each property.

```typescript
import { s } from "s-val";

const userSchema = s.object({
  properties: {
    id: s.number({ integer: true, positive: true }),
    name: s.string({ validate: { minLength: 2 } }),
    email: s.string({ validate: { email: true } }),
    isAdmin: s.boolean({ optional: true }),
  },
});

// A valid user
await userSchema.parse({
  id: 1,
  name: "John Doe",
  email: "johndoe@example.com",
}); // ✅

// A valid user with the optional isAdmin property
await userSchema.parse({
  id: 2,
  name: "Jane Doe",
  email: "jane@example.com",
  isAdmin: true,
}); // ✅

// Missing a required property
await userSchema.parse({
  id: 3,
  email: "bad@example.com",
}); // ❌ (name is missing)

// Fails a nested validation rule
await userSchema.parse({
  id: 4,
  name: "Tim",
  email: "not-an-email",
}); // ❌ (email is invalid)
```

## Configuration

### `strict`

By default, objects allow unknown properties. To disallow any properties not defined in your schema, set `strict: true`.

- **Type**: `boolean`
- **Default**: `false`

```typescript
const strictSchema = s.object({
  properties: { name: s.string() },
  strict: true,
});

// This will pass
await strictSchema.parse({ name: "John" }); // ✅

// This will fail because `age` is an unknown property
await strictSchema.parse({ name: "John", age: 30 }); // ❌
```

### `partial`

You can make all properties in an object schema optional by setting `partial: true`. This is useful for validating partial updates.

- **Type**: `boolean`
- **Default**: `false`

```typescript
const userSchema = s.object({
  properties: {
    name: s.string(),
    email: s.string({ validate: { email: true } }),
  },
});

const partialUserSchema = s.object({
  ...userSchema.config,
  partial: true,
});

// All of these are now valid
await partialUserSchema.parse({}); // ✅
await partialUserSchema.parse({ name: "John Doe" }); // ✅
await partialUserSchema.parse({ email: "john@example.com" }); // ✅
```

## Optional and Nullable Properties

You can mark individual properties as optional or nullable within their own schema definitions.

- `optional: true`: The property can be `undefined` or entirely missing.
- `nullable: true`: The property's value can be `null`.

```typescript
const schema = s.object({
  properties: {
    required: s.string(),
    canBeMissing: s.string({ optional: true }),
    canBeNull: s.string({ nullable: true }),
    canBeBoth: s.string({ optional: true, nullable: true }),
  },
});

await schema.parse({
  required: "hello",
  canBeNull: null,
}); // ✅
```
