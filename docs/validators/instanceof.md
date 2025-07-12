# InstanceOf Validator

The `instanceof` validator checks if a value is an instance of a given class.

## Usage

`s.instanceof()` takes one argument: the class constructor.

```typescript
import { s } from "s-val";

class TestClass {}
class AnotherClass {}

const schema = s.instanceof(TestClass);

const instance = new TestClass();
schema.parse(instance); // ✅

const anotherInstance = new AnotherClass();
schema.parse(anotherInstance); // ❌
```
