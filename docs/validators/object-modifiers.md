# Object Modifiers

The `object` schema in `s-val` provides several chainable methods that allow you to create new schemas by transforming an existing one. These "modifier" methods are powerful tools for creating reusable and composable validation logic.

All modifier methods are immutable; they do not change the original schema but instead return a new `ObjectSchema` instance.

## .partial()

The `.partial()` method makes all properties on an object schema optional. This is useful when you want to validate a subset of an object's properties, such as when updating a database record.

### Signature

```typescript
.partial(): ObjectSchema<Partial<T>>
```

### Example

```typescript
import { s } from "s-val";

const userSchema = s.object({
  properties: {
    name: s.string(),
    email: s.string({ email: true }),
  },
});

const partialUserSchema = userSchema.partial();

// This is now valid, as all properties are optional.
await partialUserSchema.parse({});

// You can still validate provided properties.
await partialUserSchema.parse({ name: "John Doe" });
```

## .pick()

The `.pick()` method creates a new schema containing only a subset of properties from the original schema. The resulting schema is `strict` by default, meaning it will not allow any properties that are not explicitly in the picked list.

### Signature

```typescript
.pick<K extends keyof T>(keys: K[]): ObjectSchema<Pick<T, K>>
```

### Example

```typescript
import { s } from "s-val";

const userSchema = s.object({
  properties: {
    id: s.string({ uuid: true }),
    name: s.string(),
    email: s.string({ email: true }),
  },
});

const userLoginSchema = userSchema.pick(["email"]);

// This will pass:
await userLoginSchema.parse({ email: "test@example.com" });

// This will fail because `name` is not in the picked schema:
await userLoginSchema.parse({
  email: "test@example.com",
  name: "John Doe",
});
```

## .omit()

The `.omit()` method is the opposite of `.pick()`. It creates a new schema that includes all properties from the original schema _except_ for those in the specified list. The resulting schema is also `strict` by default.

### Signature

```typescript
.omit<K extends keyof T>(keys: K[]): ObjectSchema<Omit<T, K>>
```

### Example

```typescript
import { s } from "s-val";

const userSchema = s.object({
  properties: {
    id: s.string({ uuid: true }),
    name: s.string(),
    email: s.string({ email: true }),
  },
});

// Create a schema for updating a user, where the ID is not allowed.
const userUpdateSchema = userSchema.omit(["id"]);

// This will pass:
await userUpdateSchema.parse({ name: "Jane Doe", email: "jane@example.com" });

// This will fail because `id` was omitted:
await userUpdateSchema.parse({
  id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  name: "Jane Doe",
  email: "jane@example.com",
});
```

## .extend()

The `.extend()` method allows you to add new properties to an existing object schema. If any of the new properties have the same key as a property in the original schema, the new property will overwrite the old one. The resulting schema is **not** strict by default. You can chain `.strict()` to it if you need a strict schema.

### Signature

```typescript
.extend<P2 extends SObjectProperties>(
  extension: P2
): ObjectSchema<P & P2>
```

### Example

```typescript
import { s } from "s-val";

const nameSchema = s.object({
  properties: {
    name: s.string(),
  },
});

const userSchema = nameSchema.extend({
  age: s.number(),
});

// This will pass:
await userSchema.parse({ name: "John Doe", age: 30 });

// Overwriting a property
const strictNumberNameSchema = nameSchema.extend({
  name: s.number(), // 'name' is now a number
});

await strictNumberNameSchema.parse({ name: 123 });
```

## .strict()

The `.strict()` method returns a new schema that will not allow any properties that are not explicitly defined in the schema. This is useful for ensuring that objects match a schema exactly.

### Signature

```typescript
.strict(): ObjectSchema<T>
```

### Example

```typescript
import { s } from "s-val";

const looseSchema = s.object({
  properties: {
    name: s.string(),
  },
});

const strictSchema = looseSchema.strict();

// This will pass:
await looseSchema.parse({ name: "John", age: 30 }); // `age` is ignored

// This will fail because `age` is an unknown property:
await strictSchema.parse({ name: "John", age: 30 });
```
