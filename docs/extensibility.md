# Extensibility: Creating Custom Validators

`s-validator` is designed to be fully extensible. While the built-in validators cover most common use cases, you can add your own reusable validation logic that feels just as integrated as the built-in types.

The best way to "extend" `s-validator` is to create a new, enhanced `s` object that includes all the standard validators plus your own. This provides the best developer experience, as your custom validator will be available as a method, like `s.myCustomValidator()`.

This process has three steps:

1.  **Create a Validator Factory**: A function that encapsulates your custom logic and returns a configured `s-validator` schema.
2.  **Create an Extended `s` Object**: A new object that combines the base `s-validator` with your new factory.
3.  **Use Your Extended `s`**: Import your enhanced `s` object throughout your project.

## Example: Creating and Integrating a `file` Validator

Let's create and integrate a custom validator for the browser `File` object.

### Step 1: Create the Validator Factory

This function will contain the core logic for the validator. It takes a configuration object and returns a schema. We'll use `s.instanceof(File)` as a base and inject custom rules.

```typescript
// validators/file.ts
import {
  s as baseS,
  type CustomValidator,
  type ValidatorConfig,
  type ValidationContext,
} from "s-validator";

type FileValidatorConfig = {
  validate?: {
    maxSize?: number; // in bytes
    allowedTypes?: string[]; // MIME types
  };
  messages?: {
    maxSize?: string;
    allowedTypes?: string;
  };
} & Omit<ValidatorConfig<File>, "validate" | "messages">;

export const file = (config: FileValidatorConfig = {}) => {
  const customValidators: CustomValidator<File>[] = [];

  const addCustomValidator = (
    name: string,
    validator: (
      value: File,
      context: ValidationContext & {
        addError: (issue: { message: string }) => void;
      }
    ) => void
  ) => {
    customValidators.push({ name, validator: validator as any });
  };

  if (config.validate?.maxSize !== undefined) {
    addCustomValidator("maxSize", (value, context) => {
      if (value.size > config.validate!.maxSize!) {
        context.addError({
          message:
            config.messages?.maxSize ||
            `File size must not exceed ${config.validate!.maxSize!} bytes.`,
        });
      }
    });
  }

  if (config.validate?.allowedTypes) {
    addCustomValidator("allowedTypes", (value, context) => {
      if (!config.validate!.allowedTypes!.includes(value.type)) {
        context.addError({
          message:
            config.messages?.allowedTypes ||
            `File type "${value.type}" is not allowed.`,
        });
      }
    });
  }

  return baseS.instanceof(File, {
    ...config,
    validate: {
      ...config.validate,
      custom: customValidators,
    },
    messages: {
      ...config.messages,
      identity: "Input must be a File object.",
    },
  });
};
```

### Step 2: Create the Extended `s` Object

Now, create a central file (e.g., `lib/s.ts`) where you'll export your enhanced `s` object. This makes your custom validators available everywhere.

```typescript
// lib/s.ts
import { s as baseS } from "s-validator";
import { file } from "../validators/file"; // Adjust the import path

// s-validator's 's' is a function with properties.
// Use Object.assign to preserve its original nature while adding your own.
export const s = Object.assign(baseS, {
  file,
  // Add other custom validators here
});

// It's also a good idea to re-export the infer type for convenience
export type infer<T> = baseS.infer<T>;
```

### Step 3: Use Your Extended Validator

Finally, in your application code, import from your local `s` file instead of directly from `s-validator`. Now you can use `s.file()` as if it were a built-in method.

```typescript
import { s, infer } from '../lib/s'; // Use your local, extended 's'

// Example: Validating a user profile with an avatar upload
const userProfileSchema = s.object({
  validate: {
    properties: {
      username: s.string(),
      avatar: s.file({ // Your custom validator in action!
        validate: {
          maxSize: 1024 * 1024, // 1MB
          allowedTypes: ['image/jpeg', 'image/png'],
        },
        messages: {
          maxSize: 'Avatar must be smaller than 1MB.',
        },
      }).optional(),
    }
  }
});

type UserProfile = infer<typeof userProfileSchema>;
```

This pattern provides true, seamless extensibility for your projects.
