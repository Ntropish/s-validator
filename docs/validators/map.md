# Map Validator

The `map` validator checks if a value is a `Map` and validates its keys and values against provided schemas.

## Usage

You pass the key and value schemas as a tuple to the `validate.identity` property.

```typescript
import { s } from "s-val";

const schema = s.map({
  validate: { identity: [s.string(), s.number()] },
});

const map = new Map([
  ["a", 1],
  ["b", 2],
]);

await schema.parse(map); // ✅

const invalidMap = new Map([
  ["a", "1"], // Value should be a number
]);

await schema.parse(invalidMap); // ❌
```
