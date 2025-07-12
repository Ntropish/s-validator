# NaN Validator

The `nan` validator checks if a value is `NaN` (Not-a-Number).

## Usage

```typescript
import { s } from "s-val";

const schema = s.nan();

schema.parse(NaN); // ✅
schema.parse(Number("hello")); // ✅
schema.parse(123); // ❌
```
