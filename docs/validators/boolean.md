# `s.boolean()`

The `boolean` validator checks if a value is a boolean (`true` or `false`).

## Usage

```typescript
import { s } from "s-validator";

const schema = s.boolean();

await schema.parse(true); // ✅
await schema.parse(false); // ✅
await schema.parse("true"); // ❌
```

## Preparations

### `coerce`

If `coerce` is `true`, the validator will convert any JavaScript "truthy" value to `true` and any "falsy" value to `false`.

- **Type**: `boolean`
- **Example**: `s.boolean({ prepare: { coerce: true } })`

```typescript
const schema = s.boolean({ prepare: { coerce: true } });

await schema.parse(1); // ✅ -> true
await schema.parse("hello"); // ✅ -> true
await schema.parse(0); // ✅ -> false
await schema.parse(""); // ✅ -> false
```

### `stringBool`

If `stringBool` is `true`, the validator will convert common string representations of booleans. This is useful for environment variables or query parameters.

- **Truthy strings**: `"true"`, `"1"`, `"yes"`, `"on"`, `"y"`, `"enabled"`
- **Falsy strings**: `"false"`, `"0"`, `"no"`, `"off"`, `"n"`, `"disabled"`

- **Type**: `boolean`
- **Example**: `s.boolean({ prepare: { stringBool: true } })`

```typescript
const schema = s.boolean({ prepare: { stringBool: true } });

await schema.parse("true"); // ✅ -> true
await schema.parse("off"); // ✅ -> false
await schema.parse("ok"); // ❌ (not a recognized boolean string)
```

## Validation Rules

### `truthy` / `falsy`

- `truthy: true`: Enforces that the value must be `true`.
- `falsy: true`: Enforces that the value must be `false`.

```typescript
const truthySchema = s.boolean({ validate: { truthy: true } });
await truthySchema.parse(true); // ✅
await truthySchema.parse(false); // ❌

const falsySchema = s.boolean({ validate: { falsy: true } });
await falsySchema.parse(false); // ✅
await falsySchema.parse(true); // ❌
```

## Transformations

### `toString`

Transforms a boolean into its string representation.

- If `toString` is `true`, it uses `"true"` and `"false"`.
- You can provide an object with `true` and `false` keys for custom string mapping.

```typescript
// Default
const schema1 = s.boolean({ transform: { toString: true } });
await schema1.parse(true); // ✅ -> "true"

// Custom
const schema2 = s.boolean({
  transform: {
    toString: {
      true: "active",
      false: "inactive",
    },
  },
});
await schema2.parse(true); // ✅ -> "active"
```

### `toNumber`

Transforms a boolean into a number (`true` -> `1`, `false` -> `0`).

```typescript
const schema = s.boolean({ transform: { toNumber: true } });

await schema.parse(true); // ✅ -> 1
await schema.parse(false); // ✅ -> 0
```
