# NaN Validator

The `nan` validator checks if a value is `NaN` (Not-a-Number).

## Usage

```typescript
import { s } from "s-val";

const schema = s.nan();

await schema.parse(NaN); // ✅
await schema.parse(Number("hello")); // ✅
await schema.parse(123); // ❌
```
