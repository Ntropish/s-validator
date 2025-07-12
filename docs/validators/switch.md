# Switch Validator

The `s.switch()` validator provides a way to dynamically choose which schema to use for validation based on the input data. This is a powerful tool for handling discriminated unions or any situation where the validation logic depends on the data itself.

## Usage

`s.switch()` takes a single configuration object with the following properties:

- `select`: A function that receives the `ValidationContext` and returns a `string` or `number`. This key is used to look up the appropriate schema from the `cases` map.
- `cases`: An object (or map) where keys are the values that can be returned by `select`, and values are the corresponding `s-val` schemas to use for validation.
- `default` (optional): A schema to use if the key returned by `select` does not exist in the `cases` map.
- `failOnNoMatch` (optional): A boolean. If `true`, the validation will fail if no case is matched and no `default` schema is provided. If `false` (the default), the original value is passed through unmodified in that scenario.

### Example: Discriminated Union

Here is an example of validating different event types. The `type` property determines which schema is used for the rest of the object.

```typescript
import { s } from "s-val";

const eventSchema = s.switch({
  // 1. The select function
  select: (ctx) => ctx.value.type,

  // 2. The cases map
  cases: {
    click: s.object({
      validate: {
        properties: {
          type: s.literal("click"),
          x: s.number(),
          y: s.number(),
        },
      },
    }),
    keypress: s.object({
      validate: {
        properties: {
          type: s.literal("keypress"),
          key: s.string(),
        },
      },
    }),
  },

  // 3. Optional default schema
  default: s.object({
    validate: {
      properties: {
        type: s.string(),
      },
    },
  }),
});

// Valid click event
await eventSchema.parse({ type: "click", x: 100, y: 200 }); // ✅

// Valid keypress event
await eventSchema.parse({ type: "keypress", key: "Enter" }); // ✅

// An event type not in the cases map will use the default schema
await eventSchema.parse({ type: "mouseover" }); // ✅

// Invalid click event (fails the 'click' schema)
try {
  await eventSchema.parse({ type: "click", x: "100" }); // ❌
} catch (e) {
  console.log(e.issues);
}
```

### Handling No Match

By default, if the `select` function returns a key that is not in `cases` and no `default` is provided, the validator will pass the original value through. To change this, set `failOnNoMatch: true`.

```typescript
const strictSwitch = s.switch({
  select: (ctx) => ctx.value.type,
  cases: {
    a: s.string(),
  },
  failOnNoMatch: true,
});

// This will now fail because there is no case for 'b'
try {
  await strictSwitch.parse({ type: "b" }); // ❌
} catch (e) {
  console.log(e.issues);
}
```
