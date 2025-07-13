# Switch Validator

The `s.switch()` validator provides a way to dynamically choose which schema to use for validation based on the input data. This is a powerful tool for handling discriminated unions or any situation where the validation logic depends on the data itself.

## Usage

`s.switch()` takes a single configuration object with the following properties:

- `select`: A function that receives the `ValidationContext` and returns a `string` or `number`. This key is used to look up the appropriate schema from the `cases` map.
- `cases`: An object (or map) where keys are the values that can be returned by `select`, and values are the corresponding `s-validator` schemas to use for validation.
- `default` (optional): A schema to use if the key returned by `select` does not exist in the `cases` map.
- `failOnNoMatch` (optional): A boolean. If `true`, the validation will fail if no case is matched and no `default` schema is provided. If `false` (the default), the original value is passed through unmodified in that scenario.

### Example: Discriminated Union

Here is an example of validating different event types. The `type` property determines which schema is used for the rest of the object.

```typescript
import { s } from "s-validator";

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

## Top-level Configuration

The `s.switch` validator can be configured with top-level preparations, transformations, and custom validators. These are applied to the switch as a whole, before and after the case-specific schema is processed.

- **`prepare`**: Runs before the `select` function is called and before the case-specific schema's preparations.
- **`validate`**: Runs after the top-level preparations but before the case-specific validation.
- **`transform`**: Runs after the case-specific schema has successfully transformed the value.

### Example: Top-level Modifiers

This example demonstrates how you can use top-level modifiers to preprocess data, add extra validation, and post-process the final result.

```typescript
import { s } from "s-validator";

const customMessage = "Input value must be greater than 0";

const schema = s.switch({
  // 1. Top-level Preparation
  prepare: {
    custom: [
      (data) => {
        // Coerce string value to a number before validation
        if (typeof data.value === "string") {
          return { ...data, value: Number(data.value) };
        }
        return data;
      },
    ],
  },

  // 2. Top-level Validation
  validate: {
    custom: [
      {
        name: "must_be_positive",
        // This validation runs before the case-specific validation
        validator: (data) => data.value > 0,
      },
    ],
  },
  messages: {
    must_be_positive: customMessage,
  },

  // 3. Switch Logic
  select: (ctx) => ctx.value.type,
  cases: {
    a: s.object({
      validate: {
        properties: {
          type: s.literal("a"),
          // This validator runs after the top-level one
          value: s.number({ validate: { multipleOf: 2 } }),
        },
      },
    }),
  },

  // 4. Top-level Transformation
  transform: {
    custom: [
      (data) => {
        // This transform runs after the case-specific schema passes
        return { ...data, transformed: true };
      },
    ],
  },
});

// --- SUCCESS CASE ---
// 'prepare' turns value "10" into 10.
// 'validate' checks that 10 > 0.
// Case 'a' validates that 10 is a multiple of 2.
// 'transform' adds the `transformed: true` flag.
const result = await schema.parse({ type: "a", value: "10" });
console.log(result); // { type: 'a', value: 10, transformed: true } ✅

// --- FAILURE CASE (TOP-LEVEL) ---
const failedResult = await schema.safeParse({ type: "a", value: -4 }); // ❌
if (failedResult.status === "error") {
  // Fails on the top-level 'must_be_positive' validator
  console.log(failedResult.error.issues[0].message); // "Input value must be greater than 0"
}
```
