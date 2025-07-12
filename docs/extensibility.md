# Extensibility: Creating Custom Validators

`s-val` is designed to be fully extensible. You can add your own custom validation logic by creating plugins. This allows you to encapsulate and reuse your validation rules, keeping your code clean and modular.

## The Plugin Architecture

At its core, `s-val` is a collection of plugins. Each validator, like `s.string()` or `s.number()`, is a self-contained plugin. A plugin is an object that can provide three key pieces of functionality:

1.  **Preparation**: A function that runs _before_ validation to modify the input value. This is useful for coercion, like converting a string to a `Date` object.
2.  **Validator**: The core validation function that checks the input and returns a `ValidationIssue` if it fails.
3.  **Transformation**: A function that runs _after_ successful validation to transform the output value.

A single plugin can contain multiple validators, preparations, or transformations.

## The `Plugin` Type

Here is the TypeScript interface for a plugin:

```typescript
export type Plugin<TName extends string, T extends Validator> = {
  name: TName;
  preparations?: PreparationMap;
  validators: ValidatorMap<T>;
  transformations?: TransformationMap;
};
```

- `name`: A unique name for your plugin (e.g., "myCustomPlugin").
- `preparations`: An optional map of preparation functions.
- `validators`: A map of validator functions and their associated error messages.
- `transformations`: An optional map of transformation functions.

## Example: Creating a `UUID` Validator

Let's create a custom plugin that adds a `uuid` validator to strings.

### 1. Define the Plugin

First, create a new file for your plugin, for example, `uuid-plugin.ts`. In this file, you'll define the plugin object.

```typescript
import { s, type Plugin } from "s-val";

// A simple regex to validate a UUID
const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const uuidPlugin = {
  name: "uuid",
  validators: {
    string: {
      uuid: (value, { path }) => {
        if (typeof value !== "string" || !UUID_REGEX.test(value)) {
          return {
            path,
            message: (ctx) => `Expected a UUID, but received ${ctx.value}`,
          };
        }
      },
    },
  },
} satisfies Plugin<"uuid", typeof s.string>;
```

**Explanation:**

- We define a plugin named `'uuid'`.
- We are augmenting the existing `string` validator.
- We add a new validation rule called `uuid`.
- The `uuid` function checks if the `value` is a string that matches our `UUID_REGEX`.
- If the validation fails, it returns a `ValidationIssue` object with a dynamic `message`. The message is a `MessageProducer` function that receives the validation context (`ctx`).

### 2. Add the Plugin

To make your custom plugin available, you need to add it to the `createSchemaBuilder`. In your main setup file (e.g. `index.ts` where you configure `s-val`):

```typescript
import { createSchemaBuilder, type Plugin } from "s-val";
import { stringPlugin } from "s-val/validators/string"; // core plugin
import { uuidPlugin } from "./uuid-plugin"; // your custom plugin

const allPlugins = [stringPlugin, uuidPlugin] as const;

export const s = createSchemaBuilder(allPlugins);

// Now you can use it!
const schema = s.string({
  validate: {
    uuid: true,
  },
});

// This will pass
await schema.parse("f47ac10b-58cc-4372-a567-0e02b2c3d479");

// This will fail
await schema.parse("not-a-uuid");
```

By adding your plugin to the schema builder, you've seamlessly extended `s-val` with your own custom logic. This approach keeps your validation rules organized and makes them easy to test and reuse across your application.
