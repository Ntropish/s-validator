# Array Validator

The `array` validator checks if a value is an array. It provides several methods for validating the array's contents and properties.

## Usage

```typescript
import { s } from "s-val";

const schema = s.array();

schema.parse([1, "two", true]); // ✅
schema.parse({ a: 1 }); // ❌
```

## Methods

### `.length(len: number)`

Checks if the array has exactly `len` elements.

```typescript
s.array().length(3).parse([1, 2, 3]); // ✅
s.array().length(3).parse([1, 2]); // ❌
```

### `.minLength(min: number)`

Checks if the array has at least `min` elements.

```typescript
s.array().minLength(2).parse([1, 2, 3]); // ✅
s.array().minLength(2).parse([1, 2]); // ✅
s.array().minLength(2).parse([1]); // ❌
```

### `.maxLength(max: number)`

Checks if the array has at most `max` elements.

```typescript
s.array().maxLength(3).parse([1, 2]); // ✅
s.array().maxLength(3).parse([1, 2, 3]); // ✅
s.array().maxLength(3).parse([1, 2, 3, 4]); // ❌
```

### `.nonEmpty()`

Checks if the array has at least one element. This is a shorthand for `.minLength(1)`.

```typescript
s.array().nonEmpty().parse([1]); // ✅
s.array().nonEmpty().parse([]); // ❌
```

### `.contains(element: any)`

Checks if the array contains the specified `element`. The check is performed using `Array.prototype.includes()`.

```typescript
s.array().contains("a").parse(["a", "b", "c"]); // ✅
s.array().contains("d").parse(["a", "b", "c"]); // ❌
```

### `.excludes(element: any)`

Checks if the array does not contain the specified `element`. The check is performed using `!Array.prototype.includes()`.

```typescript
s.array().excludes("d").parse(["a", "b", "c"]); // ✅
s.array().excludes("a").parse(["a", "b", "c"]); // ❌
```

### `.unique()`

Checks if all elements in the array are unique.

```typescript
s.array().unique().parse([1, 2, 3]); // ✅
s.array().unique().parse([1, 2, 2]); // ❌
```

### `.ofType(schema: SchemaLike)`

Checks if every element in the array matches the provided `schema`.

```typescript
const stringArray = s.array().ofType(s.string());

stringArray.parse(["a", "b", "c"]); // ✅
stringArray.parse(["a", "b", 1]); // ❌
```

### `.items(schemas: SchemaLike[])`

Checks if the array's elements match the `schemas` provided, in order. This is used for validating tuples. The array must have the same number of elements as the `schemas` array.

```typescript
const tupleSchema = s.array().items([s.string(), s.number(), s.boolean()]);

tupleSchema.parse(["a", 1, true]); // ✅
tupleSchema.parse(["a", 1]); // ❌ (length mismatch)
tupleSchema.parse(["a", 1, "c"]); // ❌ (type mismatch)
```
