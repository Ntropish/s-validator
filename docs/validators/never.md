# Never Validator

The `never` validator rejects every value passed to it. This is useful for ensuring a code path is never reached, such as in the `default` case of a `switch` statement where you have exhaustively handled all cases.

## Usage

```typescript
import { s } from "s-val";

const schema = s.never();

schema.parse(123); // ❌
schema.parse(null); // ❌
```
