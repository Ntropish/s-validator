# Object Validator

The `object` validator checks if a value is a non-null, non-array object.

## Usage

```typescript
import { s } from "s-val";

const schema = s.object();

schema.parse({ key: "value" }); // ✅
schema.parse(null); // ❌
schema.parse(["an", "array"]); // ❌
```

## Methods

### `.properties(shape: Record<string, SchemaLike>)`

The `.properties()` method is the primary way to define the shape and validation rules for an object. It takes a `shape` object where each key corresponds to a key in the object being validated, and each value is another `s-val` schema.

```typescript
import { s } from "s-val";

const userSchema = s.object().properties({
  id: s.number().integer().positive(),
  name: s.string().minLength(2),
  email: s.string().email(),
  isAdmin: s.boolean().optional(),
});

// A valid user
userSchema.parse({
  id: 1,
  name: "John Doe",
  email: "johndoe@example.com",
}); // ✅

// A valid user with the optional isAdmin property
userSchema.parse({
  id: 2,
  name: "Jane Doe",
  email: "jane@example.com",
  isAdmin: true,
}); // ✅

// Missing a required property
userSchema.parse({
  id: 3,
  email: "bad@example.com",
}); // ❌ (name is missing)

// Fails a nested validation rule
userSchema.parse({
  id: 4,
  name: "Tim",
  email: "not-an-email",
}); // ❌ (email is invalid)
```

### Optional and Nullable Properties

You can mark individual properties within an object as `optional` or `nullable`.

- `.optional()`: The property can be `undefined` or entirely missing from the object.
- `.nullable()`: The property's value can be `null`.

```typescript
const schema = s.object().properties({
  required: s.string(),
  canBeMissing: s.string().optional(),
  canBeNull: s.string().nullable(),
  canBeBoth: s.string().optional().nullable(),
});

// Valid
schema.parse({
  required: "hello",
  canBeMissing: "world",
  canBeNull: "not null",
  canBeBoth: "present",
}); // ✅

// Missing an optional property
schema.parse({
  required: "hello",
  canBeNull: "not null",
  canBeBoth: "present",
}); // ✅

// A nullable property is null
schema.parse({
  required: "hello",
  canBeMissing: "world",
  canBeNull: null,
  canBeBoth: "present",
}); // ✅

// A property that is both optional and nullable is missing
schema.parse({
  required: "hello",
  canBeMissing: "world",
  canBeNull: "not null",
}); // ✅

// A property that is both optional and nullable is null
schema.parse({
  required: "hello",
  canBeMissing: "world",
  canBeNull: "not null",
  canBeBoth: null,
}); // ✅
```
