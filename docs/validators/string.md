# String Validator

The `s.string()` validator checks if a value is a string. It also provides a wide range of additional checks for length, patterns, and common string formats.

## Basic Usage

```typescript
import { s } from "s-val";

const schema = s.string();

await schema.parse("hello"); // -> "hello"
await schema.parse(123); // -> throws ValidationError
```

## Usage

You can pass a configuration object to `s.string()` to specify validation rules. All validation properties are optional.

```typescript
// A string that must be a valid email and have a max length of 100.
const emailSchema = s.string({
  validate: {
    email: true,
    maxLength: 100,
  },
});

await emailSchema.parse("test@example.com"); // ✅
await emailSchema.parse("not-an-email"); // ❌
```

## Validation Properties

All validation rules are passed inside a `validate` property in the configuration object.

### Length and Range

- `length: number`: Checks if the string has an exact length.
- `minLength: number`: Checks if the string has a minimum length (inclusive).
- `maxLength: number`: Checks if the string has a maximum length (inclusive).
- `range: [min: number, max: number]`: Checks if the string's length is within an inclusive range.
- `exclusiveRange: [min: number, max: number]`: Checks if the string's length is within an exclusive range.

**Example:**

```typescript
await s.string({ validate: { minLength: 3 } }).parse("abc"); // ✅
await s.string({ validate: { range: [3, 5] } }).parse("abcd"); // ✅
await s.string({ validate: { range: [3, 5] } }).parse("ab"); // ❌
```

### Patterns and Content

- `pattern: RegExp`: Checks if the string matches a regular expression.
- `oneOf: string[]`: Checks if the string is one of the specified options.

**Example:**

```typescript
await s.string({ validate: { pattern: /^[a-z]+$/ } }).parse("abc"); // ✅
await s.string({ validate: { oneOf: ["admin", "user"] } }).parse("user"); // ✅
```

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

### JSON Schema

The `json` validator checks if a string is a valid JSON string that also conforms to a nested schema.

**Example:**

```typescript
const userJsonSchema = s.string({
  validate: {
    json: s.object({
      properties: { name: s.string() },
    }),
  },
});

await userJsonSchema.parse('{ "name": "John" }'); // ✅
await userJsonSchema.parse('{ "name": 123 }'); // ❌
```
