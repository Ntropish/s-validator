# BigInt Validator

The `bigint` validator checks if a value is a `bigint`.

## Usage

```typescript
import { s } from "s-validator";

const schema = s.bigint();

await schema.parse(123n); // ✅
await schema.parse(BigInt(9007199254740991)); // ✅
await schema.parse(123); // ❌
```
