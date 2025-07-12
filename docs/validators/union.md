# Union Validator

The `s.union()` validator allows you to combine multiple schemas into one. The validation will pass if the input value matches **at least one** of the provided schemas.

## Usage

You create a union schema by passing a configuration object to `s.union()`. The schemas to be validated against are provided in an array under the `validate.variants` key.

### Union of Primitive Types

You can use `s.union()` to allow a value to be one of several primitive types.

```typescript
import { s } from "s-val";

const stringOrNumberSchema = s.union({
  validate: {
    variants: [s.string(), s.number()],
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
    variants: [
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

## Error Handling

If a value fails to validate against all of the schemas in the union, the `ValidationError` will contain a collection of all the issues encountered while trying each schema. This can be useful for debugging why a value failed validation.
