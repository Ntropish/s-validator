# Unknown Validator

The `unknown` validator accepts any value. It is similar to `s.any()`, but it provides better type safety by inferring the type as `unknown` instead of `any`. This forces you to perform type-checking before using the value.

## Usage

```typescript
import { s } from "s-val";

const schema = s.unknown();

schema.parse(123); // ✅
schema.parse("hello"); // ✅
schema.parse(null); // ✅

const validated = await schema.parse({ a: 1 });

if (typeof validated === "object" && validated !== null && "a" in validated) {
  // This is safe because of the type check
  console.log(validated.a);
}
```
