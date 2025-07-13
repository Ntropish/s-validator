# `s.lazy()`

The `s.lazy()` utility is essential for creating recursive schemas, where a schema needs to refer to itself. A common use case is validating a data structure that can be nested, like a file system tree or a nested comment thread.

## Usage

`s.lazy()` takes a single argument: a function that returns a schema. This function is only called the first time the schema is used, which breaks the circular dependency that would otherwise occur during instantiation.

### Example: Recursive File System Tree

Here is an example of a recursive schema for a file system entry, which can be either a file or a folder containing other entries.

```typescript
import { s } from "s-validator";

interface File {
  type: "file";
  name: string;
}

interface Folder {
  type: "folder";
  name: string;
  children: Entry[];
}

type Entry = File | Folder;

const entrySchema: s.Schema<Entry> = s.lazy(() =>
  s.union({
    validate: {
      of: [fileSchema, folderSchema],
    },
  })
);

const fileSchema = s.object({
  validate: {
    properties: {
      type: s.literal("file"),
      name: s.string(),
    },
  },
});

const folderSchema = s.object({
  validate: {
    properties: {
      type: s.literal("folder"),
      name: s.string(),
      children: s.array(entrySchema),
    },
  },
});
```

In this example, `entrySchema` refers to `folderSchema`, which in turn refers back to `entrySchema` through its `children` property. `s.lazy()` makes this circular reference possible.
