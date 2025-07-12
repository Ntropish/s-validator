# Set Validator

The `set` validator checks if a value is a `Set` and validates its values against a provided schema.

## Usage

`s.set()` takes one argument: a schema for the values in the set.

```typescript
import { s } from "s-val";

const schema = s.set(s.number());

const set = new Set([1, 2, 3]);
await schema.parse(set); // ✅

const invalidSet = new Set([1, "2", 3]); // Contains a string
await schema.parse(invalidSet); // ❌
```
