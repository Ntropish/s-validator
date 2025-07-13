# Map Validator

The `map` validator checks if a value is a `Map` and validates its keys and values against provided schemas.

## Usage

You pass the key schema and value schema as arguments to the `s.map()` method.

```typescript
import { s } from "s-validator";

const schema = s.map(s.string(), s.number());

const map = new Map([
  ["a", 1],
  ["b", 2],
]);

await schema.parse(map); // ✅

const invalidMap = new Map([
  ["a", "1"], // Value should be a number
]);

try {
  await schema.parse(invalidMap); // ❌
} catch (e) {
  console.log(e.issues);
}
```
