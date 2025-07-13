<pre>
(This document is AI generated and not implemented or verified)
</pre>

# S-VALIDATOR Extensibility

## Abstract

This document specifies a comprehensive and fully composable extensibility
architecture for the S-VALIDATOR library. The proposed architecture
enables developers to create highly customized validation instances by
assembling decoupled "Schema Blueprints" and "Logic Plugins" via a
central "Assembler" function. This modular design allows for the
creation of lightweight, purpose-built validators, the extension of
core library features, and the introduction of new, first-class schema
types in a consistent and unified manner.

## Status of This Memo

This Internet-Draft is submitted in full conformance with the provisions
of BCP 78 and BCP 79.

Internet-Drafts are working documents of the Internet Engineering Task
Force (IETF). Note that other groups may also distribute working
documents as Internet-Drafts. The list of current Internet-Drafts is
at https://datatracker.ietf.org/drafts/current/.

Internet-Drafts are draft documents valid for a maximum of six months
and may be updated, replaced, or obsoleted by other documents at any
time. It is inappropriate to use Internet-Drafts as reference material
or to cite them other than as "work in progress."

This Internet-Draft will expire on April 2024.

## Copyright Notice

Copyright (c) 2023 IETF Trust and the persons identified as the
document authors. All rights reserved.

This document is subject to BCP 78 and the IETF Trust's Legal
Provisions Relating to IETF Documents
(https://trustee.ietf.org/license-info) in effect on the date of
publication of this document. Please review these documents
carefully, as they describe your rights and restrictions with respect
to this document.

## Table of Contents

1. [Introduction](#1-introduction)
2. [Terminology](#2-terminology)
3. [Architectural Overview](#3-architectural-overview)
   1. [The Three-Layer Model](#31-the-three-layer-model)
   2. [Schema Blueprints](#32-schema-blueprints)
   3. [Logic Plugins](#33-logic-plugins)
   4. [The Assembler](#34-the-assembler)
4. [Core Component: The Schema Blueprint](#4-core-component-the-schema-blueprint)
   1. [The `getChildren()` Method](#41-the-getchildren-method)
   2. [Centralized Recursive Processing](#42-centralized-recursive-processing)
5. [Core Component: The Logic Plugin](#5-core-component-the-logic-plugin)
   1. [Plugin Structure](#51-plugin-structure)
6. [Core Component: The Assembler (`createSValidator`)](#6-core-component-the-assembler-createsvalidator)
   1. [The Configuration Object](#61-the-configuration-object)
7. [Public API: Exported Maps for Composability](#7-public-api-exported-maps-for-composability)
   1. [The `coreLogicPlugins` Map](#71-the-corelogicplugins-map)
   2. [The `unpopulatedSConfig` Map](#72-the-unpopulatedsconfig-map)
   3. [The `populatedSConfig` Map](#73-the-populatedsconfig-map)
8. [Use Cases](#8-use-cases)
   1. [Extending the Standard Validator](#81-extending-the-standard-validator)
   2. [Creating a Lightweight Validator](#82-creating-a-lightweight-validator)
   3. [Creating a New Schema Type](#83-creating-a-new-schema-type)
9. [Security Considerations](#9-security-considerations)
10. [IANA Considerations](#10-iana-considerations)
11. [Acknowledgements](#11-acknowledgements)

---

## 1. Introduction

The S-VALIDATOR library provides type-safe data validation. While a default, "batteries-included" validator is provided, many use cases require a more tailored solution. Developers may need to:

a) create lightweight validators with a minimal feature set to reduce bundle size.
b) extend the core validation rules with domain-specific logic.
c) introduce entirely new, first-class schema types for complex data structures.

This document specifies a "pluggable" architecture that addresses these needs. It decouples the structural definition of a schema (a "Blueprint") from its validation logic (a "Plugin"). A factory function (the "Assembler") is provided to compose these components into a final, customized validator instance. This approach grants developers full control over the composition and functionality of their validation library.

## 2. Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all capitals, as shown here.

- **Schema Blueprint**: An un-opinionated constructor function or class (e.g., `ObjectSchema`) that defines the fundamental structure and traversal logic for a data type. It contains no specific validation rules (e.g., `minLength`). Its primary role is to implement the `getChildren()` method for recursive processing.

- **Logic Plugin**: A stateless object containing a collection of preparations, validations, and/or transformations for a specific `dataType`. For example, a `stringCorePlugin` would contain all the standard logic (`minLength`, `email`, etc.) for the `'string'` dataType.

- **Assembler**: The `createSValidator` function. Its role is to take a configuration object, which specifies which Blueprints to use and which Logic Plugins to apply, and assemble them into a final, usable `s-validator` instance.

- **Unpopulated Configuration**: A configuration map (`unpopulatedSConfig`) that pairs builder names (e.g., `'string'`) with their corresponding Schema Blueprint and an empty `plugins` array. It serves as a "blank slate" for developers who wish to build a validator from scratch.

- **Populated Configuration**: A configuration map (`populatedSConfig`) that mirrors the `unpopulatedSConfig` but comes pre-filled with the standard `coreLogicPlugins`. It serves as the "batteries-included" default and is the recommended starting point for developers who wish to extend the standard library.

## 3. Architectural Overview

The S-VALIDATOR extensibility model is built upon a three-layer architecture that separates concerns between the structural definition of data, the logic used to validate that data, and the mechanism for assembling a final validator. This layered approach is the key to the library's composability and flexibility.

### 3.1. The Three-Layer Model

1.  **The Schema Blueprint Layer (The "What")**: This foundational layer consists of raw, un-opinionated schema constructors. Their sole responsibility is to define the fundamental structure of a data type (e.g., an `ObjectSchema` knows how to handle properties, an `ArraySchema` knows how to handle items) and how to traverse it recursively. They contain no specific validation logic themselves.

2.  **The Logic Plugin Layer (The "How")**: This layer is composed of pure, stateless collections of validation logic (validators, preparations, and transformations). Each plugin targets a specific `dataType` (e.g., `'string'`) and provides a set of rules for that type. This layer is completely decoupled from the blueprints.

3.  **The Assembler Layer (The "Factory")**: This top layer consists of a single factory function, `createSValidator`. This function acts as the assembler, taking a configuration that specifies which blueprints to use and which logic plugins to apply, and producing the final, customized `s-validator` instance with a complete API.

This separation ensures that developers can interject at any level of abstraction, from building a validator from scratch using raw blueprints to simply adding one custom rule to the standard, fully-populated library.

### 3.2. Schema Blueprints

Schema Blueprints are the primitives of the library. They form a structural contract. For example, the `ObjectSchema` blueprint guarantees that it will iterate over the properties of an object value. It makes no assumptions, however, about what constitutes a _valid_ object. That determination is left to the Logic Plugins.

### 3.3. Logic Plugins

Logic Plugins provide the "opinions" about what makes data valid. Because they are decoupled from the blueprints, the same plugin can be reused in different contexts. A developer could, in theory, create a custom blueprint that behaves like an object and apply the `stringCorePlugin` to its properties, demonstrating true component independence.

### 3.4. The Assembler

The Assembler is the engine that brings the other two layers together. It reads the developer-provided configuration, dynamically constructs the builder methods for the `s` object (e.g., `s.string`, `s.object`), and injects the specified validation logic from the plugins into the appropriate schema instances at creation time. This runtime assembly is what allows for the creation of completely tailored validator toolsets.

## 4. Core Component: The Schema Blueprint

A Schema Blueprint is a class that extends the base `Schema`. Its primary responsibility is to define the structure of a data type and provide a mechanism for iterating over its "child" schemas.

### 4.1. The `getChildren()` Method

To enable centralized recursive processing, every Schema Blueprint that represents a container or composite type (e.g., `ObjectSchema`, `ArraySchema`, `UnionSchema`) MUST implement a `getChildren()` method. Primitive schemas that cannot contain other schemas (e.g., `StringSchema`, `NumberSchema`) do not need to implement this method.

The `getChildren()` method is a generator function responsible for yielding the child schemas for a given value.

**Signature:**

```typescript
getChildren(value: any): Iterable<[
  string | number, // The key or index of the child relative to the parent
  Schema<any, any>, // The child schema instance
  any               // The value of the child
]>
```

**Behavior:**

- For a given `value`, the method MUST iterate over its logical children.
- For each child, it MUST `yield` a three-element tuple containing the child's key/index, the corresponding schema used for its validation, and the child's value.
- If a `value` has no children (e.g., an empty object or array), or if the `value` is not of a type that can be iterated (e.g., `null`), the method MUST return without yielding anything.

**Example Implementation for `ObjectSchema`:**

```typescript
class ObjectSchema extends Schema {
  // ... constructor ...

  *getChildren(value: any) {
    if (value === null || typeof value !== "object") {
      return;
    }

    const shape = this.getProperties(); // Method to get the defined schema shape
    for (const key in shape) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const propertySchema = shape[key];
        const propertyValue = value[key];
        yield [key, propertySchema, propertyValue];
      }
    }
  }
}
```

### 4.2. Centralized Recursive Processing

The base `Schema` class will contain the master `_prepare`, `_validate`, and `_transform` methods. These methods will use the `getChildren()` method to orchestrate the validation process for all composite types.

The processing steps are as follows:

1.  Run the parent schema's own preparations/validations/transformations on the top-level value.
2.  Call `this.getChildren(value)` to get an iterator for the child elements.
3.  For each yielded child:
    a. Construct a new `ValidationContext` for the child, updating the path with the child's key.
    b. Recursively call the corresponding `_prepare`, `_validate`, or `_transform` method on the child's schema with the child's value and new context.
    c. Aggregate results, handle errors, and build the final transformed object.

This abstraction ensures that subclasses are simple and declarative. They only need to define _how_ to find their children, not _what_ to do with them. This eliminates redundant recursive logic and centralizes the complex process of context management and error aggregation.

## 5. Core Component: The Logic Plugin

A Logic Plugin is a stateless, declarative object that bundles validation logic. It is the sole mechanism for introducing preparations, validations, and transformations into a schema.

### 5.1. Plugin Structure

A Logic Plugin is an object that MUST conform to the following structure:

```typescript
type LogicPlugin = {
  /**
   * The data type this plugin's logic applies to.
   * This MUST match the `dataType` of a Schema Blueprint.
   */
  dataType: string;

  /**
   * An object map of preparation functions.
   * The key is the preparation name used in the config (e.g., 'trim').
   */
  prepare?: Record<string, (value: any, ...args: any[]) => any>;

  /**
   * An object map of validation rule definitions.
   * The key is the validation name used in the config (e.g., 'minLength').
   */
  validate?: Record<
    string,
    {
      validator: (value: any, ...args: any[]) => boolean | Promise<boolean>;
      message: string | ((context: MessageContext) => string);
    }
  >;

  /**
   * An object map of transformation functions.
   * The key is the transformation name used in the config.
   */
  transform?: Record<string, (value: any, ...args: any[]) => any>;
};
```

**Key Principles:**

- **Stateless**: A Logic Plugin MUST NOT hold any state. It is a pure collection of functions. All state required for validation (e.g., a `minLength` value) is passed into its functions from the schema's configuration at runtime.
- **Decoupled**: A Logic Plugin is only coupled to a `dataType` string. It has no direct knowledge of or reference to any specific Schema Blueprint class. This allows the same logic to be applied to any blueprint that shares the same `dataType`.
- **Composable**: Multiple Logic Plugins targeting the same `dataType` can be provided to the Assembler. The Assembler is responsible for merging the logic from all provided plugins into a single, unified collection of rules for that `dataType`. In case of conflicting rule names, the last plugin in the array SHOULD take precedence.

## 6. Core Component: The Assembler (`createSValidator`)

The Assembler is the factory function that consumes Schema Blueprints and Logic Plugins and produces a final, usable `s-validator` instance.

**Signature:**

```typescript
createSValidator(config: SValidatorConfig): SValidatorInstance
```

The function takes a single `SValidatorConfig` object and returns a new `s` object, which is an instance of the `SValidatorInstance` type.

### 6.1. The Configuration Object

The `SValidatorConfig` is a map where each key represents the name of a builder method to be created on the final `s` object (e.g., `string`, `object`). Each value is a `BuilderConfig` object with the following structure:

```typescript
type BuilderConfig = {
  /**
   * A reference to the Schema Blueprint class to be instantiated
   * when the builder method is called.
   */
  blueprint: new (...args: any[]) => Schema<any, any>;

  /**
   * An array of Logic Plugins containing the validation logic
   * to be associated with this blueprint.
   */
  plugins: LogicPlugin[];
};

type SValidatorConfig = Record<string, BuilderConfig>;
```

**Assembly Process:**

For each `(builderName, builderConfig)` entry in the provided `SValidatorConfig`, the `createSValidator` function MUST perform the following steps:

1.  **Merge Plugins**: It MUST merge all `LogicPlugin` objects within the `builderConfig.plugins` array into a single, unified set of preparations, validators, and transformations for the `dataType` associated with the blueprint.

2.  **Create Master Logic Maps**: It MUST store this merged logic in internal master maps (`validatorMap`, `preparationMap`, etc.) that will be passed to schema instances.

3.  **Generate Builder Method**: It MUST generate a new builder method on the `SValidatorInstance` (e.g., `s.string()`).

4.  **Instantiate Schema**: When this generated builder method is called by the end-user, it MUST:
    a. Instantiate a new object from the specified `builderConfig.blueprint` class.
    b. Pass the master logic maps (from step 2) and the user-provided configuration (e.g., `{ validate: { minLength: 5 } }`) into the new schema instance's constructor.

This process ensures that each schema instance created by the final `s` object has access to exactly the logic defined in its configuration, and no more.

## 7. Public API: Exported Maps for Composability

To facilitate the creation of custom validator instances and minimize boilerplate, the S-VALIDATOR library MUST export three pre-configured map objects. These maps provide standardized, convenient starting points for developers.

### 7.1. The `coreLogicPlugins` Map

This object serves as the canonical library of all standard validation logic.

- **Structure**: A map where each key is a `dataType` string (e.g., `'string'`, `'number'`) and each value is the `LogicPlugin` object containing all the standard, built-in preparations, validations, and transformations for that data type.
- **Purpose**: Allows developers to pick and choose specific rule sets when building a lightweight validator from scratch. For example, a developer could import `coreLogicPlugins.string` and `coreLogicPlugins.number` to build a validator that only handles strings and numbers.

### 7.2. The `unpopulatedSConfig` Map

This object provides the collection of "blank slate" Schema Blueprints.

- **Structure**: A `SValidatorConfig` object. Each key is a standard builder name (e.g., `'string'`), and each value is a `BuilderConfig` object containing a reference to the corresponding `blueprint` and an **empty `plugins` array**.
- **Purpose**: This is the primary entry point for developers who want to build a custom validator with maximum control and a minimal footprint. They can construct a new configuration object by picking blueprints from this map and then selectively adding logic from the `coreLogicPlugins` map or their own custom plugins.

### 7.3. The `populatedSConfig` Map

This object represents the standard, "batteries-included" S-VALIDATOR configuration.

- **Structure**: A `SValidatorConfig` object that is a deep copy of the `unpopulatedSConfig`. However, the `plugins` array for each builder is pre-populated with the corresponding plugin from the `coreLogicPlugins` map.
- **Purpose**: This is the primary entry point for developers who want to use the standard library and simply add their own custom functionality. A developer can make a copy of this object, push their own `LogicPlugin` into the desired `plugins` array, and then pass the modified config to `createSValidator`. The default `s` export of the library is functionally equivalent to `createSValidator(populatedSConfig)`.

## 8. Use Cases

This section provides practical examples of how the architectural components and public APIs are intended to be used.

### 8.1. Extending the Standard Validator

This is the most common use case, where a developer wishes to add a domain-specific rule to the standard, "batteries-included" validator.

**Goal**: Add an `isSemver` validator to the standard `s.string()` builder.

1.  **Create the Logic Plugin**:

    ```typescript
    // plugins/semverPlugin.ts
    export const semverPlugin = {
      dataType: "string",
      validate: {
        isSemver: {
          validator: (value: string) => /^(...semver regex...)/.test(value),
          message: "String must be a valid semantic version.",
        },
      },
    };
    ```

2.  **Assemble the Custom Validator**:

    ```typescript
    // lib/s.ts
    import { createSValidator, populatedSConfig } from "s-validator";
    import { semverPlugin } from "../plugins/semverPlugin";

    // Deep copy the standard config to avoid mutating the original
    const myConfig = JSON.parse(JSON.stringify(populatedSConfig));

    // Add the custom plugin to the 'string' builder's logic
    myConfig.string.plugins.push(semverPlugin);

    export const s = createSValidator(myConfig);
    ```

### 8.2. Creating a Lightweight Validator

This use case is for developers who need to minimize bundle size and only require a small subset of the library's functionality.

**Goal**: Create a validator that can only validate string CUIDs and objects.

1.  **Assemble the Custom Validator**:

    ```typescript
    // lib/s.ts
    import {
      createSValidator,
      unpopulatedSConfig,
      coreLogicPlugins,
    } from "s-validator";

    // Extract only the 'cuid' rule from the core string logic
    const cuidPlugin = {
      dataType: "string",
      validate: { cuid: coreLogicPlugins.string.validate.cuid },
    };

    export const s = createSValidator({
      string: {
        blueprint: unpopulatedSConfig.string.blueprint,
        plugins: [cuidPlugin],
      },
      object: {
        blueprint: unpopulatedSConfig.object.blueprint,
        plugins: [], // No special object logic needed
      },
    });
    ```

    The resulting `s` object will have `s.string()` and `s.object()` methods, but `s.string()` will only know the `cuid` validator, and `s.number()` will not exist.

### 8.3. Creating a New Schema Type

This is the most advanced use case, where a developer introduces a new, first-class schema type.

**Goal**: Create an `s.url()` builder for validating `URL` objects.

1.  **Create a new Schema Blueprint**:

    ```typescript
    // schemas/UrlSchema.ts
    class UrlSchema extends Schema {
      constructor(config, maps) {
        super("url", config, maps);
      }
      // This schema has no children, so getChildren() is not needed.
    }
    ```

2.  **Create the associated Logic Plugin**:

    ```typescript
    // plugins/urlPlugin.ts
    export const urlPlugin = {
      dataType: "url",
      prepare: {
        coerce: (val) => (typeof val === "string" ? new URL(val) : val),
      },
      validate: {
        identity: {
          validator: (val) => val instanceof URL,
          message: "Input must be a URL object.",
        },
      },
    };
    ```

3.  **Assemble the Custom Validator**:

    ```typescript
    // lib/s.ts
    import { createSValidator, populatedSConfig } from "s-validator";
    import { UrlSchema } from "../schemas/UrlSchema";
    import { urlPlugin } from "../plugins/urlPlugin";

    const myConfig = JSON.parse(JSON.stringify(populatedSConfig));

    // Add the new builder to the configuration
    myConfig.url = {
      blueprint: UrlSchema,
      plugins: [urlPlugin],
    };

    export const s = createSValidator(myConfig);
    ```

    The resulting `s` object now has a new top-level `s.url()` method.

## 9. Security Considerations

The extensibility model specified in this document relies on the execution of code provided by third-party Logic Plugins and Schema Blueprints. The `createSValidator` function will execute functions from any plugin provided in its configuration.

Implementers and consumers of this architecture MUST be aware of the potential risks. A malicious or poorly-written plugin can introduce security vulnerabilities, such as denial-of-service vectors via inefficient regular expressions, or introduce arbitrary code execution if it uses unsafe functions like `eval()`.

Therefore, consumers of the library SHOULD only use plugins and blueprints from trusted sources and SHOULD perform security reviews of any third-party validation code before integrating it into a production environment.

## 10. IANA Considerations

This document has no IANA actions.

## 11. Acknowledgements

The architecture specified in this document was developed through a collaborative, iterative design process. The authors would like to acknowledge the valuable feedback and key insights provided by the project contributors, which were instrumental in achieving the final, robust, and composable design.
