# String Validator

The `s.string()` validator checks if a value is a string. It also provides a wide range of additional checks for length, patterns, and common string formats.

## Basic Usage

```typescript
import { s } from "s-validator";

const schema = s.string();

await schema.parse("hello"); // -> "hello"

try {
  await schema.parse(123); // -> throws ValidationError
} catch (e) {
  console.log(e.issues);
}
```

## Preparation

Use the `prepare` object to modify the string _before_ it is validated.

| Property      | Description                         |
| ------------- | ----------------------------------- |
| `trim`        | Trims whitespace from both ends.    |
| `toLowerCase` | Converts the string to lowercase.   |
| `toUpperCase` | Converts the string to uppercase.   |
| `toNull`      | Converts an empty string to `null`. |

**Example:**

```typescript
const emailSchema = s.string({
  prepare: {
    trim: true,
    toLowerCase: true,
  },
  validate: {
    email: true,
  },
});

// The input is trimmed and lowercased before validation.
const result = await emailSchema.parse("  TEST@EXAMPLE.COM  ");
console.log(result); // -> "test@example.com"
```

## Validation

All validation rules are passed inside a `validate` object in the configuration.

### Length and Range

- `length: number`: Checks if the string has an exact length.
- `minLength: number`: Checks if the string has a minimum length (inclusive).
- `maxLength: number`: Checks if the string has a maximum length (inclusive).
- `range: [min: number, max: number]`: Checks if the string's length is within an inclusive range.
- `exclusiveRange: [min: number, max: number]`: Checks if the string's length is within an exclusive range.

### Patterns and Content

- `pattern: RegExp`: Checks if the string matches a regular expression.
- `oneOf: string[]`: Checks if the string is one of the specified options.

### Format Validators

These validators check for common string formats. They are all enabled by passing `true`.

| Property    | Description                        |
| ----------- | ---------------------------------- |
| `email`     | A valid email address.             |
| `url`       | A valid URL.                       |
| `uuid`      | A valid UUID.                      |
| `uuidV7`    | A valid UUID v7.                   |
| `cuid`      | A valid CUID.                      |
| `cuid2`     | A valid CUID2.                     |
| `ulid`      | A valid ULID.                      |
| `emoji`     | A valid emoji.                     |
| `ipv4`      | A valid IPv4 address.              |
| `ipv4Cidr`  | A valid IPv4 CIDR block.           |
| `ipv6`      | A valid IPv6 address.              |
| `ipv6Cidr`  | A valid IPv6 CIDR block.           |
| `base64`    | A valid base64 string.             |
| `base64Url` | A valid base64url string.          |
| `datetime`  | An ISO 8601 datetime string.       |
| `date`      | An ISO 8601 date string (no time). |
| `time`      | An ISO 8601 time string (no date). |
| `duration`  | An ISO 8601 duration string.       |
| `hexColor`  | A valid hex color code.            |
| `semver`    | A valid semantic version string.   |

**Example:**

```typescript
const schema = s.string({ validate: { uuid: true } });
await schema.parse("f47ac10b-58cc-4372-a567-0e02b2c3d479"); // ✅
await schema.parse("not-a-uuid"); // ❌
```

The `email` validator can also be configured with `allowed` and `denied` lists for domains.

```typescript
await s
  .string({
    validate: {
      email: { denied: ["example.com", /\.dev$/] },
    },
  })
  .parse("test@example.com"); // ❌
```

## Transformation

Use the `transform` object to modify the string _after_ it has been validated.

**Example: Adding a prefix**

```typescript
const handleSchema = s.string({
  prepare: {
    trim: true,
    toLowerCase: true,
  },
  validate: {
    pattern: /^[a-z0-9_]+$/,
    minLength: 3,
  },
  transform: {
    custom: [(value) => `@${value}`],
  },
});

const handle = await handleSchema.parse("  MyHandle_123  ");
console.log(handle); // -> "@myhandle_123"
```

## Advanced Validators

### JSON Schema

The `json` validator checks if a string is a valid JSON string that also conforms to a nested schema.

**Example:**

```typescript
const userJsonSchema = s.string({
  validate: {
    json: s.object({
      validate: {
        properties: { name: s.string() },
      },
    }),
  },
});

await userJsonSchema.parse('{ "name": "John" }'); // ✅
await userJsonSchema.parse('{ "name": 123 }'); // ❌
```
