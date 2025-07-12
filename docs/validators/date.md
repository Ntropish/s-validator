# Date Validator

The `date` validator checks if a value is a JavaScript `Date` object.

## Usage

```typescript
import { s } from "s-val";

const schema = s.date();

schema.parse(new Date()); // ✅
schema.parse("2023-01-01"); // ❌
```

## Methods

### `.min(minDate: Date)`

Checks if the date is on or after `minDate`.

```typescript
const min = new Date("2023-01-01");

s.date().min(min).parse(new Date("2023-01-02")); // ✅
s.date().min(min).parse(new Date("2023-01-01")); // ✅
s.date().min(min).parse(new Date("2022-12-31")); // ❌
```

### `.max(maxDate: Date)`

Checks if the date is on or before `maxDate`.

```typescript
const max = new Date("2023-01-01");

s.date().max(max).parse(new Date("2022-12-31")); // ✅
s.date().max(max).parse(new Date("2023-01-01")); // ✅
s.date().max(max).parse(new Date("2023-01-02")); // ❌
```
