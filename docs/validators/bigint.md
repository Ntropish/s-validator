# `s.bigint()`

The `bigint` validator checks if a value is a JavaScript `bigint`.

## Usage

You can create a basic `bigint` schema by calling `s.bigint()` with no arguments.

```typescript
import { s } from "s-validator";

const schema = s.bigint();

await schema.parse(123n); // ✅
await schema.parse(BigInt(9007199254740991)); // ✅

await schema.parse(123); // ❌
```

## Preparations

### `coerce`

You can enable `coerce` to automatically convert strings, numbers, and booleans into `bigint`s before validation.

- **Type**: `boolean`
- **Example**: `s.bigint({ prepare: { coerce: true } })`

```typescript
const schema = s.bigint({ prepare: { coerce: true } });

await schema.parse("123"); // ✅ -> 123n
await schema.parse(456); // ✅ -> 456n
await schema.parse(true); // ✅ -> 1n
```

## Validation Rules

### Comparison

- `gt: bigint`: Checks if the value is greater than the given `bigint`.
- `gte: bigint`: Checks if the value is greater than or equal to the given `bigint`.
- `lt: bigint`: Checks if the value is less than the given `bigint`.
- `lte: bigint`: Checks if the value is less than or equal to the given `bigint`.

```typescript
const schema = s.bigint({ validate: { gt: 10n, lte: 20n } });

await schema.parse(15n); // ✅
await schema.parse(20n); // ✅
await schema.parse(10n); // ❌
```

### Sign

- `positive: true`: Checks if the value is greater than `0n`.
- `negative: true`: Checks if the value is less than `0n`.

```typescript
const positiveSchema = s.bigint({ validate: { positive: true } });
await positiveSchema.parse(1n); // ✅
await positiveSchema.parse(0n); // ❌
```

### `multipleOf`

- `multipleOf: bigint`: Checks if the value is a multiple of the given `bigint`.

```typescript
const schema = s.bigint({ validate: { multipleOf: 3n } });

await schema.parse(9n); // ✅
await schema.parse(10n); // ❌
```
