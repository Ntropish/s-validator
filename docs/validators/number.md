# Number Validator

The `number` validator checks if a value is a number. It provides several methods for more specific numeric validations.

## Usage

```typescript
import { s } from "s-val";

const schema = s.number();

schema.parse(123); // ✅
schema.parse(12.3); // ✅
schema.parse("123"); // ❌
```

## Methods

### `.min(value: number)`

Checks if the number is greater than or equal to `value`.

```typescript
s.number().min(5).parse(10); // ✅
s.number().min(5).parse(5); // ✅
s.number().min(5).parse(4); // ❌
```

### `.max(value: number)`

Checks if the number is less than or equal to `value`.

```typescript
s.number().max(5).parse(1); // ✅
s.number().max(5).parse(5); // ✅
s.number().max(5).parse(6); // ❌
```

### `.gt(value: number)`

Checks if the number is greater than `value`.

```typescript
s.number().gt(5).parse(6); // ✅
s.number().gt(5).parse(5); // ❌
```

### `.gte(value: number)`

Checks if the number is greater than or equal to `value`. (Alias for `.min()`)

```typescript
s.number().gte(5).parse(5); // ✅
s.number().gte(5).parse(4); // ❌
```

### `.lt(value: number)`

Checks if the number is less than `value`.

```typescript
s.number().lt(5).parse(4); // ✅
s.number().lt(5).parse(5); // ❌
```

### `.lte(value: number)`

Checks if the number is less than or equal to `value`. (Alias for `.max()`)

```typescript
s.number().lte(5).parse(5); // ✅
s.number().lte(5).parse(6); // ❌
```

### `.range([min, max]: [number, number])`

Checks if the number is within the inclusive range `[min, max]`.

```typescript
s.number().range([5, 10]).parse(7); // ✅
s.number().range([5, 10]).parse(5); // ✅
s.number().range([5, 10]).parse(10); // ✅
s.number().range([5, 10]).parse(4); // ❌
s.number().range([5, 10]).parse(11); // ❌
```

### `.exclusiveRange([min, max]: [number, number])`

Checks if the number is within the exclusive range `(min, max)`.

```typescript
s.number().exclusiveRange([5, 10]).parse(7); // ✅
s.number().exclusiveRange([5, 10]).parse(5); // ❌
s.number().exclusiveRange([5, 10]).parse(10); // ❌
```

### `.integer()`

Checks if the number is an integer.

```typescript
s.number().integer().parse(10); // ✅
s.number().integer().parse(10.5); // ❌
```

### `.positive()`

Checks if the number is positive (> 0).

```typescript
s.number().positive().parse(1); // ✅
s.number().positive().parse(0); // ❌
s.number().positive().parse(-1); // ❌
```

### `.negative()`

Checks if the number is negative (< 0).

```typescript
s.number().negative().parse(-1); // ✅
s.number().negative().parse(0); // ❌
s.number().negative().parse(1); // ❌
```

### `.zero()`

Checks if the number is exactly 0.

```typescript
s.number().zero().parse(0); // ✅
s.number().zero().parse(1); // ❌
```

### `.float()`

Checks if the number is a float (i.e., not an integer).

```typescript
s.number().float().parse(10.5); // ✅
s.number().float().parse(10); // ❌
```

### `.multipleOf(value: number)`

Checks if the number is a multiple of `value`.

```typescript
s.number().multipleOf(5).parse(10); // ✅
s.number().multipleOf(5).parse(7); // ❌
```

### `.even()`

Checks if the number is even.

```typescript
s.number().even().parse(2); // ✅
s.number().even().parse(3); // ❌
```

### `.odd()`

Checks if the number is odd.

```typescript
s.number().odd().parse(3); // ✅
s.number().odd().parse(2); // ❌
```
