# InstanceOf Validator

The `instanceof` validator checks if a value is an instance of a given class using the `instanceof` operator.

## Usage

You pass the class constructor directly to the `s.instanceof()` method.

```typescript
import { s } from "s-val";

class TestClass {}
class AnotherClass {}

const schema = s.instanceof(TestClass);

const instance = new TestClass();
await schema.parse(instance); // ✅

try {
  const anotherInstance = new AnotherClass();
  await schema.parse(anotherInstance); // ❌
} catch (e) {
  console.log(e.issues);
}
```
