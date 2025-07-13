# Base `Schema` Class

The `Schema` class is the cornerstone of `s-validator`. All other schema types, like `ObjectSchema` and `ArraySchema`, extend from it. You will typically interact with this class directly only when you are creating your own custom validators.

For a practical guide on extending the `Schema` class, see the [Extensibility Guide](../extensibility.md).

## Core Concepts

The base `Schema` class is responsible for:

- Managing the three-phase validation pipeline: **prepare**, **validate**, and **transform**.
- Handling `optional` and `nullable` modifiers.
- Storing and resolving custom error messages.
- Providing the `parse` and `safeParse` methods for executing the validation.

## Key Methods

### `constructor(dataType, config)`

When extending the `Schema` class, you must call `super()` in your constructor.

- `dataType: string`: A string identifier for your schema, used in default error messages (e.g., "string", "myCustomValidator").
- `config: object`: The configuration object provided by the user. The base class will process this to extract preparations, validations, and transformations.

### `_validate(value, context)`

This is the primary method you will override in a custom schema. It receives the prepared value and is expected to perform the core validation logic.

- If validation fails, it should throw a `ValidationError`.
- If validation succeeds, it should return `undefined` or `void`.

The base `_validate` method handles `optional` and `nullable` checks, so you should always call `await super._validate(value, context);` at the beginning of your implementation.

### `_transform(value, context)`

This method is called after successful validation. You can override it to perform data transformations. It should return the final, transformed value.

The base `_transform` method handles any `.transform()` configurations, so you should call `await super._transform(value, context);` if you want to preserve that functionality.

### `parse(data)`

Executes the full validation pipeline.

- **On success**: Returns the transformed data.
- **On failure**: Throws a `ValidationError`.

### `safeParse(data)`

Executes the full validation pipeline and returns a result object, preventing the need for a `try...catch` block.

- **On success**: Returns `{ status: 'success', data: ... }`.
- **On failure**: Returns `{ status: 'error', error: ... }`.

### `optional()`

Returns a new schema instance that allows the value to be `undefined`.

### `nullable()`

Returns a new schema instance that allows the value to be `null`.
