# `s.object()`

The `object` validator checks if a value is a non-null, non-array object and validates its properties against a defined shape.

## Usage

You define the shape of an object by passing a configuration object to `s.object()`. The object's properties are defined in `validate.properties`.

```typescript
import { s } from "s-validator";

const userSchema = s.object({
  validate: {
    properties: {
      name: s.string({ validate: { minLength: 2 } }),
      email: s.string({ validate: { email: true } }),
      isAdmin: s.boolean({ optional: true }),
    },
  },
});

await userSchema.parse({
  name: "John Doe",
  email: "johndoe@example.com",
}); // ✅
```

## Validation Rules

### `strict`

By default, any properties in the input object that are not defined in the schema are stripped out. To throw an error for unknown properties instead, set `strict: true`.

- **Type**: `boolean`
- **Example**: `s.object({ strict: true, ... })`

```typescript
const strictSchema = s.object({
  strict: true,
  validate: { properties: { name: s.string() } },
});

await strictSchema.parse({ name: "John" }); // ✅
await strictSchema.parse({ name: "John", age: 30 }); // ❌ (age is an unknown property)
```

### `custom` (Cross-Field Validation)

You can define custom validation rules that apply to the object as a whole, which is useful for cross-field validation.

```typescript
const schema = s.object({
  validate: {
    properties: {
      username: s.string(),
      age: s.number(),
    },
    custom: [
      {
        validator: (v) => !(v.username === "admin" && v.age < 99),
        message: "Admin users must be at least 99 years old",
      },
    ],
  },
});

await schema.parse({ username: "admin", age: 98 }); // ❌
```

## Object Modifiers

Object schemas have methods that return a new, modified schema instance.

- **`.partial()`**: Makes all properties optional.
- **`.pick(['key1', 'key2'])`**: Creates a new schema with only the selected properties.
- **`.omit(['key1', 'key2'])`**: Creates a new schema with the specified properties removed.
- **`.extend({ key3: s.string() })`**: Creates a new schema with additional or overwritten properties.

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

// A schema with only optional `id` and `name`
const partialIdAndName = userSchema.pick(["id", "name"]).partial();
```

## Recursive Schemas

For schemas that need to refer to themselves (e.g., a tree structure), you must defer the evaluation of the recursive property. You can do this with either `s.lazy()` or a getter property.

### Using `s.lazy()`

This is the recommended approach for complex recursive types.

```typescript
import { s, Schema } from "s-validator";

type Category = {
  name: string;
  subcategories: Category[];
};

const categorySchema: Schema<Category> = s.lazy(() =>
  s.object({
    validate: {
      properties: {
        name: s.string(),
        subcategories: s.array(categorySchema),
      },
    },
  })
);
```

### Using a Getter

For simple self-references within an object, a getter can be more concise.

```typescript
type Person = {
  name: string;
  spouse?: Person;
};

const personSchema: Schema<Person> = s.object({
  validate: {
    properties: {
      name: s.string(),
      get spouse() {
        return personSchema.optional();
      },
    },
  },
});
```
