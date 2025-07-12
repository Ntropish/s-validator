# String Validator

The `s.string()` validator checks if a value is a string. It also provides a wide range of additional checks for length, patterns, and common string formats.

## Basic Usage

```typescript
import { s } from "s-val";

const schema = s.string();

await schema.parse("hello"); // -> "hello"
await schema.parse(123); // -> throws ValidationError
```

## Configuration

### `length`

Checks if the string has an exact length.

- **Type:** `number`
- **Example:** `s.string({ length: 5 })`

### `minLength`

Checks if the string has a minimum length (inclusive).

- **Type:** `number`
- **Example:** `s.string({ minLength: 3 })`

### `maxLength`

Checks if the string has a maximum length (inclusive).

- **Type:** `number`
- **Example:** `s.string({ maxLength: 10 })`

### `range`

Checks if the string's length is within a specified range (inclusive).

- **Type:** `[number, number]` (a tuple of `[min, max]`)
- **Example:** `s.string({ range: [3, 10] })`

### `exclusiveRange`

Checks if the string's length is within a specified range (exclusive).

- **Type:** `[number, number]` (a tuple of `[min, max]`)
- **Example:** `s.string({ exclusiveRange: [3, 10] })`

### `pattern`

Checks if the string matches a regular expression.

- **Type:** `RegExp`
- **Example:** `s.string({ pattern: /^[a-z]+$/ })`

### `oneOf`

Checks if the string is one of the specified options.

- **Type:** `string[]`
- **Example:** `s.string({ oneOf: ["admin", "user", "guest"] })`

### `email`

Checks if the string is a valid email address. Can be configured with `allowed` and `denied` lists for domains.

- **Type:** `boolean` or `{ allowed?: (string | RegExp)[], denied?: (string | RegExp)[] }`
- **Example:**
  ```typescript
  s.string({ email: true });
  s.string({ email: { denied: ["example.com", /\.dev$/] } });
  ```

### `json`

Checks if the string is a valid JSON string that also conforms to a nested schema.

- **Type:** `Schema`
- **Example:**
  ```typescript
  const userJson = s.string({
    json: s.object({
      properties: { name: s.string() },
    }),
  });
  ```

## Format Validators

These validators check for common string formats. They are all enabled by passing `true`. Most can also be passed `false` to ensure the string does _not_ match the format.

| Property    | Description                        |
| ----------- | ---------------------------------- |
| `url`       | A valid URL.                       |
| `uuid`      | A valid UUID.                      |
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
const schema = s.string({ uuid: true });

await schema.parse("f47ac10b-58cc-4372-a567-0e02b2c3d479"); // -> "f47ac10b-58cc-4372-a567-0e02b2c3d479"
await schema.parse("not-a-uuid"); // -> throws ValidationError
```
