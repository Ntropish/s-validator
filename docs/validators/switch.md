# `s.switch()`

The `s.switch()` validator provides a way to dynamically choose which schema to use for validation based on the input data. This is a powerful tool for handling discriminated unions or any situation where the validation logic depends on the data itself.

## Usage

`s.switch()` takes a single configuration object with the following properties:

- `select`: A function that receives the `ValidationContext` and should return a key (string or number) used to look up the appropriate schema from the `cases` object.
- `cases`: An object where keys are the values that can be returned by `select`, and values are the corresponding `s-validator` schemas.
- `default` (optional): A schema to use if the key returned by `select` does not exist in the `cases` object.
- `failOnNoMatch` (optional): A boolean. If `true`, validation will fail if no case is matched and no `default` schema is provided. Defaults to `false`.

### Example: Discriminated Union

Here is an example of validating different event types where a `type` property determines the object's shape.

```typescript
import { s } from "s-validator";

const eventSchema = s.switch({
  select: (ctx) => ctx.value.type,
  cases: {
    USER_CREATED: s.object({
      validate: {
        properties: {
          type: s.literal("USER_CREATED"),
          userId: s.string({ validate: { uuid: true } }),
        },
      },
    }),
    ORDER_PLACED: s.object({
      validate: {
        properties: {
          type: s.literal("ORDER_PLACED"),
          orderId: s.string({ validate: { cuid: true } }),
        },
      },
    }),
  },
});

// Valid user event
await eventSchema.parse({
  type: "USER_CREATED",
  userId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
}); // ✅

// Valid order event
await eventSchema.parse({
  type: "ORDER_PLACED",
  orderId: "caaaaaaaaaaaaaaaaaaaaaaaa",
}); // ✅
```

### `default` and `failOnNoMatch`

You can control the behavior for unmatched cases.

- Use `default` to provide a fallback schema.
- Use `failOnNoMatch: true` to throw an error if no case is found and there is no default.

```typescript
import { s } from "s-validator";

// Example with a default schema
const schemaWithDefault = s.switch({
  select: (ctx) => (ctx.value as any).key,
  cases: {
    a: s.string({ validate: { minLength: 100 } }),
  },
  default: s.string({ validate: { maxLength: 5 } }),
});

await schemaWithDefault.parse("short"); // ✅ Uses default schema
await schemaWithDefault.parse("this is way too long"); // ❌ Fails default schema's validation

// Example with `failOnNoMatch`
const strictSchema = s.switch({
  select: (ctx) => (ctx.value as any).type,
  cases: {
    a: s.string(),
  },
  failOnNoMatch: true,
});

await strictSchema.parse({ type: "b" }); // ❌ Throws error
```

## Top-level Configuration

The `s.switch` validator can be configured with top-level `prepare`, `transform`, and `validate` blocks. These are applied to the switch as a whole, before and after the case-specific schema is processed.

```typescript
import { s } from "s-validator";

const customMessage = "Top-level validation failed";

const schema = s.switch({
  // 1. Top-level Validation
  validate: {
    custom: [
      {
        name: "top_level_check",
        validator: (data) => data.value > 100,
      },
    ],
  },
  messages: {
    top_level_check: customMessage,
  },

  // 2. Switch Logic
  select: (ctx) => ctx.value.key,
  cases: {
    a: s.object({
      validate: {
        properties: {
          value: s.number(),
        },
      },
    }),
  },

  // 3. Top-level Transformation
  transform: {
    custom: [(data) => ({ ...data, transformed: true })],
  },
});

// This will pass all checks
const result = await schema.parse({ key: "a", value: 101 });
console.log(result); // { key: 'a', value: 101, transformed: true }

// This will fail the top-level validation
const { error } = await schema.safeParse({ key: "a", value: 99 });
console.log(error.issues[0].message); // "Top-level validation failed"
```
