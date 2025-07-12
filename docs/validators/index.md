# Validator Reference

This section provides a detailed API reference for all of the built-in validators available in `s-val`.

## Core Concepts

In `s-val`, a "validator" is a schema that defines a set of rules for a specific data type. All validators are functions available on the main `s` object (e.g., `s.string()`, `s.number()`).

### Schema Configuration

You can configure a validator by passing it a configuration object. Each property in this object corresponds to a specific validation rule.

```typescript
// A string that must be at least 5 characters long and a valid email.
const emailSchema = s.string({
  minLength: 5,
  email: true,
});
```

### Modifiers

Two special configuration properties, `optional` and `nullable`, can be applied to any schema.

- `optional: true`: Allows the value to be `undefined`. For object properties, this means the key can be missing.
- `nullable: true`: Allows the value to be `null`.

These are explained in more detail in the [main documentation](../index.md#modifiers).

### Custom Error Messages

Every validator accepts a `messages` property in its configuration object. This allows you to override the default error messages for any validation rule.

You can customize the message for the base type check using the `identity` key.

```typescript
const nameSchema = s.string({
  minLength: 2,
  messages: {
    identity: "Name must be a string.",
    minLength: "Name must be at least 2 characters long.",
  },
});

try {
  await nameSchema.parse(123);
} catch (error) {
  // error.issues[0].message will be "Name must be a string."
}

try {
  await nameSchema.parse("A");
} catch (error) {
  // error.issues[0].message will be "Name must be at least 2 characters long."
}
```

## Available Validators

Validators are grouped by category.

### Primitives

- [Any](./any.md)
- [BigInt](./bigint.md)
- [Boolean](./boolean.md)
- [Date](./date.md)
- [Number](./number.md)
- [String](./string.md)

### Data Structures

- [Array](./array.md)
- [Map](./map.md)
- [Object](./object.md)
- [Record](./record.md)
- [Set](./set.md)

### Composition & Logic

- [InstanceOf](./instanceof.md)
- [Object Modifiers](./object-modifiers.md)
- [Switch](./switch.md)
- [Union](./union.md)

### Special Values

- [Literal](./literal.md)
- [NaN](./nan.md)
- [Never](./never.md)
- [Unknown](./unknown.md)
