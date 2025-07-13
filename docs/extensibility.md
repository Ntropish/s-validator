# Extensibility: The Plugin System

`s-validator` is designed with a powerful and flexible plugin system that allows you to add new validators or extend existing ones. This approach ensures that your custom logic can be seamlessly integrated and reused across your projects, with full TypeScript support.

The core of this system is the `createSValidator` function.

## The `createSValidator` Function

Instead of using the default `s` export, you can create your own customized instance of `s-validator` by calling `createSValidator` with an array of plugins.

```typescript
import { createSValidator } from "s-validator";
import { myCustomPlugin, anotherPlugin } from "./plugins";

export const s = createSValidator([myCustomPlugin, anotherPlugin]);

// You can also re-export the infer type for convenience
export { type infer } from "s-validator";
```

This new `s` object will have all the standard validators plus the custom functionality you've defined in your plugins.

## The Plugin API

A plugin is an object that specifies new preparations, validations, or transformations for a given `dataType`.

Here is the basic structure of a plugin:

```typescript
export const myPlugin = {
  dataType: "string", // The data type to extend (e.g., 'string', 'number')

  // Add new validation rules
  validate: {
    isPositive: {
      validator: (value: number) => value > 0,
      message: ({ label }) => `${label} must be positive.`,
    },
  },

  // Add new data preparations
  prepare: {
    trim: (value: string) => value.trim(),
  },

  // Add new data transformations
  transform: {
    addSalutation: (value: string) => `Mr./Ms. ${value}`,
  },
};
```

## Example 1: Extending an Existing Validator

Let's create a plugin that adds an `isAwesome` check to the `s.string()` validator.

#### 1. Define the Plugin

```typescript
// plugins/awesome-string.ts

export const awesomeStringPlugin = {
  dataType: "string",
  validate: {
    isAwesome: {
      validator: (value: string) => value.includes("awesome"),
      message: ({ label }) => `${label || "String"} must be awesome!`,
    },
  },
};
```

#### 2. Create the Custom `s` Instance

```typescript
// lib/s.ts
import { createSValidator } from "s-validator";
import { awesomeStringPlugin } from "../plugins/awesome-string";

export const s = createSValidator([awesomeStringPlugin]);
export { type infer } from "s-validator";
```

#### 3. Use the Extended Validator

Now you can import your custom `s` and use the new `.isAwesome()` method.

```typescript
import { s } from "../lib/s";

const schema = s.string({
  validate: {
    isAwesome: true, // Use your custom rule!
  },
});

schema.parse("this is awesome"); // -> "this is awesome"
await schema.safeParse("this is not"); // -> { status: 'error', ... }
```

## Example 2: Creating a New Validator

The plugin system can also be used to create entirely new, first-class validator types. Let's create an `s.file()` validator for the browser `File` object.

This is a more advanced use case that involves creating a new schema within the plugin.

#### 1. Define the Plugin and Factory Function

```typescript
// plugins/file.ts
import { s as baseS, Schema, ValidatorConfig, Plugin } from "s-validator";

// Define the config for our new validator
type FileValidatorConfig = {
  validate?: {
    maxSize?: number; // in bytes
    allowedTypes?: string[]; // MIME types
  };
} & ValidatorConfig<File>;

// Create a factory function that returns a pre-configured schema
function fileValidator(config: FileValidatorConfig = {}): Schema<File> {
  const customValidators = [];

  if (config.validate?.maxSize !== undefined) {
    customValidators.push(
      baseS.custom((file: File) => file.size <= config.validate!.maxSize!)
    );
  }

  if (config.validate?.allowedTypes) {
    customValidators.push(
      baseS.custom((file: File) =>
        config.validate!.allowedTypes!.includes(file.type)
      )
    );
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
}

// Define the plugin to add the 'file' property
export const filePlugin = {
  file: fileValidator,
};
```

#### 2. Create the Custom `s` Instance

Here, instead of passing a plugin to `createSValidator`, we can `Object.assign` to add our new validator to the base `s` object. This is a simpler approach for adding new validator types.

```typescript
// lib/s.ts
import { s as baseS } from "s-validator";
import { filePlugin } from "../plugins/file";

export const s = Object.assign(baseS, filePlugin);
export { type infer } from "s-validator";
```

#### 3. Use the New Validator

You can now use `s.file()` just like any other built-in validator.

```typescript
import { s } from "../lib/s";

const userProfileSchema = s.object({
  validate: {
    properties: {
      username: s.string(),
      avatar: s
        .file({
          validate: {
            maxSize: 1024 * 1024, // 1MB
            allowedTypes: ["image/jpeg", "image/png"],
          },
        })
        .optional(),
    },
  },
});
```

This pattern provides true, seamless extensibility for your projects, allowing you to build a validation library perfectly tailored to your needs.
