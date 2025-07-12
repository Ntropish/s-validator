# Map Validator

The `map` validator checks if a value is a `Map` and validates its keys and values against provided schemas.

## Usage

`s.map()` takes two arguments: a schema for the keys and a schema for the values.

```typescript
import { s } from "s-val";

const schema = s.map(s.string(), s.number());

const map = new Map([
  ["a", 1],
  ["b", 2],
]);

schema.parse(map); // ✅

const invalidMap = new Map([
  ["a", "1"], // Value should be a number
]);

schema.parse(invalidMap); // ❌
```
