# Set Validator

The `set` validator checks if a value is a `Set` and validates its values against a provided schema.

## Usage

You pass the value schema to the `validate.identity` property.

```typescript
import { s } from "s-val";

const schema = s.set({ validate: { identity: s.number() } });

const set = new Set([1, 2, 3]);
await schema.parse(set); // ✅

const invalidSet = new Set([1, "2", 3]); // Contains a string
await schema.parse(invalidSet); // ❌
```
