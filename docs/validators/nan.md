# `s.nan()`

The `nan` validator checks if a value is `NaN` (Not-a-Number).

## Usage

```typescript
import { s } from "s-validator";

const schema = s.nan();

// A direct NaN value
await schema.parse(NaN); // ✅

// The result of an invalid number operation
await schema.parse(Number("hello")); // ✅

// Any other value will fail
await schema.parse(123); // ❌
```
