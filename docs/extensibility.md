# Extensibility: Creating Custom Schemas

`s-val` is designed to be fully extensible. While the built-in validators cover most common use cases, you may have custom validation logic that you want to encapsulate and reuse. The best way to do this is by creating your own schema class that extends the base `s.Schema`.

## The `Schema` Class

The `s.Schema` class is the foundation for all validators in `s-val`. By extending it, you can create a new validator with its own `_validate` and `_transform` logic, while inheriting all the powerful features of the base schema, like `.optional()`, `.nullable()`, custom messages, and more.

## Example: Creating a `PhoneNumberSchema`

Let's create a custom schema that validates and formats a US phone number. We want it to:

1. Accept a 10-digit string.
2. Format it into a standard `(XXX) XXX-XXXX` string.

### 1. Define the Custom Schema Class

Create a new file, for example, `phone-number-schema.ts`. In this file, you'll define your new schema class.

```typescript
import { s, type ValidationContext, type ValidationError } from "s-val";

const PHONE_REGEX = /^\d{10}$/;

export class PhoneNumberSchema extends s.Schema<string, string> {
  constructor() {
    // The first argument is the data type name, used in error messages.
    super("phoneNumber");
  }

  // The _validate method checks the input after basic type checks.
  async _validate(value: any, context: ValidationContext): Promise<any> {
    // First, run the base validation from s.Schema (handles optional, nullable, etc.)
    await super._validate(value, context);

    if (typeof value !== "string" || !PHONE_REGEX.test(value)) {
      throw new s.ValidationError([
        {
          path: context.path,
          message: "Must be a 10-digit phone number.",
        },
      ]);
    }
  }

  // The _transform method runs after successful validation.
  async _transform(value: string, context: ValidationContext): Promise<string> {
    const transformedValue = await super._transform(value, context);

    // Format the 10-digit string into a standard format.
    return `(${transformedValue.slice(0, 3)}) ${transformedValue.slice(
      3,
      6
    )}-${transformedValue.slice(6)}`;
  }
}
```

### 2. Create an Instance Function

For a better developer experience, it's a good practice to create a small factory function that creates an instance of your new schema. This makes it feel like a built-in `s-val` validator.

You can add this to the same file or a central export file.

```typescript
// phoneNumber-schema.ts (continued)

export function phoneNumber() {
  return new PhoneNumberSchema();
}
```

### 3. Use Your New Schema

Now you can import and use your custom `phoneNumber` schema just like any other `s-val` validator.

```typescript
import { phoneNumber } from "./phoneNumber-schema";

const userSchema = s.object({
  validate: {
    properties: {
      name: s.string(),
      // Use your custom schema!
      phone: phoneNumber(),
    },
  },
});

const user = {
  name: "John Doe",
  phone: "1234567890",
};

const validatedUser = await userSchema.parse(user);

console.log(validatedUser.phone); // -> "(123) 456-7890"
```

By extending the `s.Schema` class, you can create powerful, reusable, and type-safe validators that are seamlessly integrated into the `s-val` ecosystem.
