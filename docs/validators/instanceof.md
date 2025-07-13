# `s.instanceof()`

The `instanceof` validator checks if a value is an instance of a given class constructor.

## Usage

You pass the class constructor as the first argument to `s.instanceof()`.

```typescript
import { s } from "s-validator";

class User {
  constructor(public name: string) {}
}

class Animal {
  constructor(public species: string) {}
}

const schema = s.instanceof(User);

// ✅ Passes for an instance of User
const user = new User("John");
await schema.parse(user);

// ❌ Throws a ValidationError for an instance of a different class
const animal = new Animal("Lion");
await schema.parse(animal);

// ❌ Throws for a plain object or primitive
await schema.parse({ name: "John" });
await schema.parse("a string");
```

## Configuration

You can pass a configuration object as the second argument to `s.instanceof()`.

### Custom Error Messages

You can provide a custom error message for the `instanceof` check by using the `identity` key in the `messages` object.

```typescript
const schema = s.instanceof(User, {
  messages: { identity: "Input must be an instance of the User class." },
});

try {
  await schema.parse(new Animal("Tiger"));
} catch (e) {
  console.log(e.issues[0].message);
  // -> "Input must be an instance of the User class."
}
```

### Modifiers

The `instanceof` validator also supports `optional` and `nullable` modifiers.

```typescript
// Optional
const optionalSchema = s.instanceof(User, { optional: true });
await optionalSchema.parse(undefined); // ✅

// Nullable
const nullableSchema = s.instanceof(User, { nullable: true });
await nullableSchema.parse(null); // ✅
```
