# Validator Reference

This section provides a detailed API reference for all of the built-in validators available in `s-validator`.

## Core Concepts

In `s-validator`, a "validator" is a schema that defines a set of rules for a specific data type. All validators are functions available on the main `s` object (e.g., `s.string()`, `s.number()`).

### Schema Configuration

You can configure any validator by passing it a configuration object. This object can contain up to four top-level keys:

- `prepare`: An object containing functions that modify the data _before_ validation (e.g., `trim`, `coerce`).
- `validate`: An object containing the rules that the data must pass (e.g., `minLength`, `min`).
- `transform`: An object containing functions that modify the data _after_ successful validation (e.g., `custom`).
- `messages`: An object containing custom error messages to override the defaults.

```typescript
// A string that is trimmed, must be at least 5 characters long, and is transformed to a greeting.
const greetingSchema = s.string({
  prepare: { trim: true },
  validate: {
    minLength: 5,
  },
  transform: {
    custom: (name) => `Hello, ${name}!`,
  },
  messages: {
    minLength: "The name must be at least 5 characters long.",
  },
});

const result = await greetingSchema.parse("  World  ");
console.log(result); // -> "Hello, World!"
```

### Modifiers

Two special configuration properties, `optional` and `nullable`, can be applied to any schema at the top level of its configuration.

- `optional: true`: Allows the value to be `undefined`. For object properties, this means the key can be missing.
- `nullable: true`: Allows the value to be `null`.

These are explained in more detail in the [main documentation](../index.md#modifiers).

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
- [Switch](./switch.md)
- [Union](./union.md)

### Special Values

- [Literal](./literal.md)
- [NaN](./nan.md)
- [Never](./never.md)
- [Unknown](./unknown.md)
