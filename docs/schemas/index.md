# Schema Reference

In `s-validator`, schemas are the core components that define the structure, rules, and transformations for your data. While validators are the user-facing API (`s.string()`, `s.object()`, etc.), schemas are the underlying classes that power them.

Understanding schemas is useful when you want to create custom, reusable validators. For more information, see the [Extensibility Guide](../extensibility.md).

## Schema Classes

The library exposes several schema classes, each designed for a specific data structure:

- **[Schema](./schema.md)**: The base class for all schemas.
- **[ObjectSchema](./object.md)**: For validating objects with a defined shape.
- **[ArraySchema](./array.md)**: For validating arrays of a specific type.
- **[SetSchema](./set.md)**: For validating `Set` objects.
- **[UnionSchema](./union.md)**: For validating a value against one of several possible schemas.
- **[SwitchSchema](./switch.md)**: For conditional validation based on input data.
