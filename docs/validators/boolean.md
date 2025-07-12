# Boolean Validator

The `boolean` validator checks if a value is a boolean (`true` or `false`).

## Usage

```typescript
import { s } from "s-val";

const schema = s.boolean();

await schema.parse(true); // ✅
await schema.parse(false); // ✅
await schema.parse("true"); // ❌
```

## Preparations

You can use preparations to convert non-boolean values into booleans before validation.

### `coerce`

If `coerce` is set to `true`, the validator will convert any JavaScript "truthy" value to `true` and any "falsy" value to `false`.

- **Type**: `boolean`
- **Default**: `false`

```typescript
const schema = s.boolean({ prepare: { coerce: true } });

// Truthy values
await schema.parse(1); // ✅ -> true
await schema.parse("hello"); // ✅ -> true
await schema.parse({}); // ✅ -> true

// Falsy values
await schema.parse(0); // ✅ -> false
await schema.parse(""); // ✅ -> false
await schema.parse(null); // ✅ -> false
```

### `stringBool`

If `stringBool` is set to `true`, the validator will convert common string representations of booleans into `true` or `false`. This is useful for handling environment variables or query parameters.

- **Truthy strings**: `"true"`, `"1"`, `"yes"`, `"on"`, `"y"`, `"enabled"`
- **Falsy strings**: `"false"`, `"0"`, `"no"`, `"off"`, `"n"`, `"disabled"`

- **Type**: `boolean`
- **Default**: `false`

```typescript
const schema = s.boolean({ prepare: { stringBool: true } });

await schema.parse("true"); // ✅ -> true
await schema.parse("yes"); // ✅ -> true
await schema.parse("off"); // ✅ -> false
await schema.parse("disabled"); // ✅ -> false

// Any other string will fail validation
await schema.parse("ok"); // ❌
```
