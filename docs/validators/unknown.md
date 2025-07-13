# Unknown Validator

The `unknown` validator accepts any value. It is similar to `s.any()`, but it provides better type safety by inferring the type as `unknown` instead of `any`. This forces you to perform type-checking before using the value.

## Usage

```typescript
import { s } from "s-validator";

const schema = s.unknown();

await schema.parse(123); // ✅
await schema.parse("hello"); // ✅
await schema.parse(null); // ✅

const validated: unknown = await schema.parse({ a: 1 });

// You must perform type checking before you can use the value
if (typeof validated === "object" && validated !== null && "a" in validated) {
  // This is safe because of the type check
  // At this point, `validated` is narrowed to a type with an 'a' property
}
```
