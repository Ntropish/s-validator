# Any Validator

The `any` validator is a pass-through that allows any value. It's useful as a placeholder or when you need to accept a value of an unknown type.

**Note:** Using `any` effectively disables type checking for that value, so it should be used with caution.

## Usage

```typescript
import { s } from "s-validator";

const schema = s.any();

await schema.parse(123); // ✅
await schema.parse("a string"); // ✅
await schema.parse({ key: "value" }); // ✅
await schema.parse(null); // ✅
await schema.parse(undefined); // ✅
```
