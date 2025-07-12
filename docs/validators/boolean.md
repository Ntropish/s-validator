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
