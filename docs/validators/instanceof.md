# InstanceOf Validator

The `instanceof` validator checks if a value is an instance of a given class.

## Usage

You pass the class constructor inside a configuration object.

```typescript
import { s } from "s-val";

class TestClass {}
class AnotherClass {}

const schema = s.instanceof({ validate: { identity: TestClass } });

const instance = new TestClass();
await schema.parse(instance); // ✅

const anotherInstance = new AnotherClass();
await schema.parse(anotherInstance); // ❌
```
