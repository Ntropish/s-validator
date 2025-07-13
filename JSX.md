# Proposal: A JSX-Native Validator (`j`) for S-VALIDATOR

This document proposes a new, declarative API for the S-VALIDATOR library that leverages JSX syntax for defining validation schemas. This API will be exposed through a separate validator object, `j`, created by a dedicated `createJValidator` assembler.

## Abstract

The core idea is to allow developers to define validation schemas using a familiar, hierarchical JSX syntax. This API will coexist with the standard, object-based `s` validator. It provides a highly intuitive and discoverable way to perform fast, synchronous, client-side validation. The process is "headless"—it does not interact with a DOM renderer, making it a lightweight, in-memory operation suitable for any environment that supports a JSX pragma.

## Core Architecture: A Shared Foundation

The new `j` validator is not a fork or a separate library; it is a different "frontend" for the same underlying validation engine. Both the standard `createSValidator` and the new `createJValidator` will be built from the same set of core Schema Blueprints and Logic Plugins as defined in the main extensibility specification. This ensures consistency and allows logic to be shared and reused between both APIs.

## API Design: The `j` Object

The `createJValidator` assembler produces a `j` object containing two parts:

1.  A set of **JSX components** (e.g., `J.Object`, `J.String`) used to build schema definitions.
2.  A `validate(data, jsx)` function to execute the validation.

### Schema Definition

Schemas are defined using components from the `j` object.

```typescript
// Assume `j` is created by `createJValidator`
import { j } from "./my-validator";

export const PostSchema = () => (
  <j.Object>
    <j.String name="title" minLength={5} required />
    <j.String name="content" />
    <j.Array name="tags">
      <j.String pattern={/^[a-z-]+$/} />
    </j.Array>
  </j.Object>
);
```

### Validation Execution

The `j.validate` function performs the validation.

```typescript
// Validate incoming API data against the JSX schema
const result = await j.validate(data, <PostSchema />);

if (result.status === "error") {
  throw new Error("Invalid post data received from server.");
}

return result.data; // Fully typed and validated data
```

## Design Rationale

### Why a Separate `j` Validator?

Separating the JSX API into its own `j` object provides a clear distinction between the two ways of defining schemas. It prevents confusion and allows each API to be optimized for its specific paradigm without cluttering the other. The standard `s` object remains a pure, programmatic API, while `j` is explicitly for those who prefer a declarative JSX syntax.

### Why `name` instead of `key`?

It is natural to consider using the `key` prop to define a property's name, as in `<j.String key="title" />`. However, this is not feasible for a critical reason:

**`key` is a special, reserved prop in JSX runtimes (including React).** Its sole purpose is to provide a stable identity for elements in a list to help with reconciliation algorithms. Because it is reserved, the `key` prop is not passed down to the component itself.

Therefore, we MUST use a standard prop. The `name` prop is the clear and idiomatic choice.

## Implementation Sketch: `createJValidator`

The `createJValidator` would take the same `SValidatorConfig` as `createSValidator`.

```typescript
export function createJValidator(config: SValidatorConfig) {
  const J = {}; // The final object to be returned
  const componentMap = new Map();

  // 1. Create the JSX components dynamically
  for (const builderName in config) {
    const Component = (props) => null; // The component is just a tag
    J[builderName.charAt(0).toUpperCase() + builderName.slice(1)] = Component;
    componentMap.set(Component, builderName);
  }

  // 2. Create the `validate` function
  J.validate = async function (data, jsxElement) {
    // buildSchemaFromJsx would traverse the JSX tree, look up builders
    // in the `config` via the `componentMap`, and construct a native
    // s-validator schema instance.
    const nativeSchema = buildSchemaFromJsx(jsxElement, config, componentMap);

    if (!nativeSchema) {
      throw new Error("Could not build a valid schema from JSX.");
    }

    return nativeSchema.safeParse(data);
  };

  return J;
}
```

## Benefits

- **Declarative API**: Provides a familiar and intuitive way to define schemas.
- **Architecturally Clean**: Separates the JSX interface from the core programmatic API.
- **Powered by the Core**: Reuses all the same underlying validation logic and blueprints, ensuring consistency.
- **Environment Agnostic**: While it uses JSX syntax, it is not tied to React's render lifecycle and can be used in any environment with a JSX transpiler.
