# BigInt Validator

The `bigint` validator checks if a value is a `bigint`.

## Usage

```typescript
import { s } from "s-val";

const schema = s.bigint();

schema.parse(123n); // ✅
schema.parse(BigInt(9007199254740991)); // ✅
schema.parse(123); // ❌
```
