# Union Validator

The `s.union()` validator allows you to combine multiple schemas into one. The validation will pass if the input value matches **at least one** of the provided schemas.

## Usage

You create a union schema by passing a configuration object to `s.union()`. The schemas to be validated against are provided in an array under the `validate.of` key.

### Union of Primitive Types

You can use `s.union()` to allow a value to be one of several primitive types.

```typescript
import { s } from "s-val";

const stringOrNumberSchema = s.union({
  validate: {
    of: [s.string(), s.number()],
  },
});

await stringOrNumberSchema.parse("hello"); // ✅
await stringOrNumberSchema.parse(123); // ✅

try {
  await stringOrNumberSchema.parse(true); // ❌
} catch (e) {
  console.log(e.issues);
}
```

### Union of Object Schemas

`s.union()` is also powerful for validating inputs that could be one of several different object shapes. The validator will try each schema in order until one passes.

```typescript
import { s } from "s-val";

const contactSchema = s.union({
  validate: {
    of: [
      // Shape for an email contact
      s.object({
        validate: {
          properties: {
            email: s.string({ validate: { email: true } }),
            source: s.literal("email"),
          },
        },
      }),
      // Shape for a phone contact
      s.object({
        validate: {
          properties: {
            phone: s.string({ validate: { length: 10 } }),
            source: s.literal("phone"),
          },
        },
      }),
    ],
  },
});

// Valid email contact
await contactSchema.parse({ source: "email", email: "user@example.com" }); // ✅

// Valid phone contact
await contactSchema.parse({ source: "phone", phone: "1234567890" }); // ✅

// Invalid contact
try {
  await contactSchema.parse({ source: "email", email: "not-an-email" }); // ❌
} catch (e) {
  console.log(e.issues);
}
```

## Top-level Configuration

Like other validators, `s.union` can be configured with top-level preparations, transformations, and custom validators. These are applied to the union as a whole.

### Top-level Preparations

A `prepare` function can modify the input before any of the variant schemas are tested.

```typescript
const schema = s.union({
  validate: { of: [s.number(), s.boolean()] },
  prepare: {
    custom: [
      (value) => {
        if (typeof value === "string" && !isNaN(Number(value))) {
          return Number(value);
        }
        return value;
      },
    ],
  },
});

// The string "123" is prepared into the number 123, which then passes.
await schema.parse("123"); // ✅ Resolves to 123
```

### Top-level Transformations

A `transform` function is applied **after** a value has successfully passed validation against one of the variants.

```typescript
const schema = s.union({
  validate: { of: [s.string(), s.number()] },
  transform: {
    custom: [(value) => ({ data: value })],
  },
});

await schema.parse("hello"); // ✅ Resolves to { data: "hello" }
await schema.parse(123); // ✅ Resolves to { data: 123 }
```

### Top-level Custom Validation

You can add a `validate` block with a `custom` validator to the union itself. This is useful for providing a custom error message if none of the variants match.

The custom validator on the union runs **only if** all the variant schemas fail.

```typescript
const customMessage = "Input must be a string or a number.";

const schema = s.union({
  validate: {
    of: [s.string(), s.number()],
    custom: [
      {
        name: "union_error",
        validator: () => false, // Always fail to trigger the message
      },
    ],
  },
  messages: {
    union_error: customMessage,
  },
});

const result = await schema.safeParse(true); // ❌

if (result.status === "error") {
  // The first issue will be our custom message
  console.log(result.error.issues[0].message); // "Input must be a string or a number."
}
```

## Error Handling

If a value fails to validate against all of the schemas in the union, the `ValidationError` will contain a collection of all the issues encountered. If a top-level custom validator is used, its issue will appear first in the list.
