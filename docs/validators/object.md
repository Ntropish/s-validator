# Object Validator

The `object` validator checks if a value is a non-null, non-array object and validates its properties against a defined shape.

## Usage

You define the shape of an object by passing a configuration object to `s.object()`. The `properties` key must be nested inside a `validate` object.

```typescript
import { s } from "s-val";

const userSchema = s.object({
  validate: {
    properties: {
      id: s.number({ validate: { integer: true, positive: true } }),
      name: s.string({ validate: { minLength: 2 } }),
      email: s.string({ validate: { email: true } }),
      isAdmin: s.boolean({ optional: true }),
    },
  },
});

// A valid user
await userSchema.parse({
  id: 1,
  name: "John Doe",
  email: "johndoe@example.com",
}); // ✅

// Missing a required property
try {
  await userSchema.parse({
    id: 3,
    email: "bad@example.com",
  }); // ❌ (name is missing)
} catch (e) {
  console.log(e.issues);
}
```

## Configuration

The following options are available in the `validate` object:

### `properties`

An object where keys are property names and values are `s-val` schemas. This defines the shape of the object.

### `strict`

By default, objects allow unknown properties. To disallow any properties not defined in your schema, set `strict: true` at the top level of the configuration.

- **Type**: `boolean`
- **Default**: `false`

```typescript
const strictSchema = s.object({
  validate: {
    properties: { name: s.string() },
  },
  strict: true,
});

// This will pass
await strictSchema.parse({ name: "John" }); // ✅

// This will fail because `age` is an unknown property
try {
  await strictSchema.parse({ name: "John", age: 30 }); // ❌
} catch (e) {
  console.log(e.issues);
}
```

## Object Modifiers

Object schemas have special methods to create new, modified schemas.

### `.partial()`

To make all properties in an object schema optional, use the `.partial()` method. This is useful for validating partial updates (e.g., for a `PATCH` request).

```typescript
const userSchema = s.object({
  validate: {
    properties: {
      name: s.string(),
      email: s.string({ validate: { email: true } }),
    },
  },
});

const partialUserSchema = userSchema.partial();

// All of these are now valid
await partialUserSchema.parse({}); // ✅
await partialUserSchema.parse({ name: "John Doe" }); // ✅
await partialUserSchema.parse({ email: "john@example.com" }); // ✅
```

### `.pick()` and `.omit()`

You can create a sub-schema that only includes or excludes certain properties using the `.pick()` and `.omit()` methods.

```typescript
const userSchema = s.object({
  validate: {
    properties: {
      id: s.number(),
      name: s.string(),
      email: s.string(),
    },
  },
});

const idAndEmailSchema = userSchema.pick(["id", "email"]);
// Creates a schema with only `id` and `email`

const nameOnlySchema = userSchema.omit(["id", "email"]);
// Creates a schema with only `name`
```

## Optional and Nullable Properties

You can mark individual properties as optional or nullable within their own schema definitions.

- `optional: true`: The property can be `undefined` or entirely missing.
- `nullable: true`: The property's value can be `null`.

```typescript
const schema = s.object({
  validate: {
    properties: {
      required: s.string(),
      canBeMissing: s.string({ optional: true }),
      canBeNull: s.string({ nullable: true }),
      canBeBoth: s.string({ optional: true, nullable: true }),
    },
  },
});

await schema.parse({
  required: "hello",
  canBeNull: null,
  // canBeMissing and canBeBoth are not present, which is valid
}); // ✅
```
