# Any Validator

The `any` validator is a pass-through that allows any value. It's useful as a placeholder or when you need to accept a value of an unknown type.

**Note:** Using `any` effectively disables type checking for that value, so it should be used with caution.

## Usage

```typescript
import { s } from "s-val";

const schema = s.any();

schema.parse(123); // ✅
schema.parse("a string"); // ✅
schema.parse({ key: "value" }); // ✅
schema.parse(null); // ✅
schema.parse(undefined); // ✅
```
