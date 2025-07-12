# Boolean Validator

The `boolean` validator checks if a value is a boolean (`true` or `false`).

## Usage

```typescript
import { s } from "s-val";

const schema = s.boolean();

schema.parse(true); // ✅
schema.parse(false); // ✅
schema.parse("true"); // ❌
```

## Methods

### `.required()`

This method is an alias for the base `s.boolean()` check and doesn't add any extra validation. It can be used for clarity to indicate that a boolean value must be present.

```typescript
s.boolean().required().parse(true); // ✅
s.boolean().required().parse(false); // ✅
```
