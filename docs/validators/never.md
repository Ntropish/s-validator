# Never Validator

The `never` validator rejects every value passed to it. This is useful for ensuring a code path is never reached, such as in the `default` case of a `switch` statement where you have exhaustively handled all cases.

## Usage

`s.never()` will always fail validation for any value provided.

```typescript
import { s } from "s-val";

const schema = s.never();

try {
  await schema.parse("anything");
} catch (e) {
  console.log("Validation failed as expected!");
}
```

It is most useful for ensuring exhaustive checking in `s.switch()` or other conditional logic. If a case is unhandled, the `s.never()` schema will cause a validation failure, alerting you to the missing case.
