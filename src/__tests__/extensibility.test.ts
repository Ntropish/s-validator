import {
  s as baseS,
  type CustomValidator,
  type ValidatorConfig,
  type ValidationContext,
  createSValidator,
  type Plugin,
} from "../index";
import { describe, it, expect } from "vitest";

// SECTION 1: Mock File API for Node.js environment
class MockFile {
  constructor(
    private readonly parts: (string | Blob)[],
    public readonly name: string,
    private readonly properties?: { type?: string }
  ) {}

  get size(): number {
    return this.parts.reduce(
      (acc, part) => acc + ((part as any).length || (part as Blob).size || 0),
      0
    );
  }

  get type(): string {
    return this.properties?.type || "";
  }
}

globalThis.File = MockFile as any;

// SECTION 2: Create the custom validator factory
type FileValidatorConfig = {
  validate?: {
    maxSize?: number; // in bytes
    allowedTypes?: string[]; // MIME types
  };
  messages?: {
    maxSize?: string;
    allowedTypes?: string;
  };
} & Omit<ValidatorConfig<File>, "validate" | "messages">;

const file = (config: FileValidatorConfig = {}) => {
  const customValidators: CustomValidator<File>[] = [];

  if (config.validate?.maxSize !== undefined) {
    customValidators.push({
      name: "maxSize",
      validator: (value) => value.size <= config.validate!.maxSize!,
    });
  }

  if (config.validate?.allowedTypes) {
    customValidators.push({
      name: "allowedTypes",
      validator: (value) => config.validate!.allowedTypes!.includes(value.type),
    });
  }

  return baseS.instanceof(File, {
    ...config,
    validate: {
      ...config.validate,
      custom: customValidators,
    },
    messages: {
      identity: "Input must be a File object.",
      maxSize: `File size must not exceed ${config.validate?.maxSize} bytes.`,
      allowedTypes: "File type is not allowed.",
      ...config.messages,
    },
  });
};

// SECTION 3: Extend the base 's' object with the new validator
const s = Object.assign(baseS, {
  file,
});

// SECTION 4: Test the new extended 's' object
describe("extensibility", () => {
  describe("custom file validator via extended s object", () => {
    it("should validate a valid File object using s.file()", async () => {
      const schema = s.file(); // Now using the extended 's'
      const testFile = new File(["content"], "test.txt", {
        type: "text/plain",
      });
      await expect(schema.parse(testFile)).resolves.toBe(testFile);
      // Also test that a base validator still works
      await expect(s.string().parse("test")).resolves.toBe("test");
    });

    it("should reject a non-File object", async () => {
      const schema = s.file();
      const result = await schema.safeParse("not a file" as any);
      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.error.issues[0].message).toBe(
          "Input must be a File object."
        );
      }
    });

    it("should validate file based on maxSize", async () => {
      const schema = s.file({ validate: { maxSize: 10 } });
      const smallFile = new File(["small"], "small.txt");
      const largeFile = new File(["a very large file content"], "large.txt");

      await expect(schema.parse(smallFile)).resolves.toBe(smallFile);
      const result = await schema.safeParse(largeFile);
      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.error.issues[0].message).toBe(
          "File size must not exceed 10 bytes."
        );
      }
    });

    it("should validate file based on allowedTypes", async () => {
      const schema = s.file({
        validate: { allowedTypes: ["image/png", "image/jpeg"] },
      });
      const pngFile = new File([""], "image.png", { type: "image/png" });
      const txtFile = new File([""], "text.txt", { type: "text/plain" });

      await expect(schema.parse(pngFile)).resolves.toBe(pngFile);
      const result = await schema.safeParse(txtFile);
      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.error.issues[0].message).toBe(
          "File type is not allowed."
        );
      }
    });

    it("should use custom error messages", async () => {
      const schema = s.file({
        validate: { maxSize: 5 }, // Add validation to trigger the error
        messages: {
          maxSize: "Custom max size error",
        },
      });
      const largeFile = new File(["a very large file content"], "large.txt");
      const result = await schema.safeParse(largeFile);
      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.error.issues[0].message).toBe("Custom max size error");
      }
    });
  });
});

describe("plugin system", () => {
  // 1. Define a plugin
  const stringPlusPlugin: Plugin<string> = {
    dataType: "string",
    validate: {
      isEmail: {
        validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: () => "Must be a valid email address",
      },
      isUrl: {
        validator: (value: string) => {
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        },
        message: () => "Must be a valid URL",
      },
    },
  };

  // 2. Create an s-validator instance with the plugin
  const sWithPlugin = createSValidator([stringPlusPlugin]);

  // 3. Create a standard s-validator instance (for comparison)
  const sWithoutPlugin = createSValidator();

  it("should successfully validate with a custom plugin validator", async () => {
    const emailSchema = sWithPlugin.string({ validate: { isEmail: true } });
    await expect(emailSchema.parse("test@example.com")).resolves.toBe(
      "test@example.com"
    );

    const urlSchema = sWithPlugin.string({ validate: { isUrl: true } });
    await expect(urlSchema.parse("https://example.com")).resolves.toBe(
      "https://example.com"
    );
  });

  it("should fail validation for invalid input with a custom plugin validator", async () => {
    const emailSchema = sWithPlugin.string({ validate: { isEmail: true } });
    const result = await emailSchema.safeParse("not-an-email");
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error.issues[0].message).toBe(
        "Must be a valid email address"
      );
    }
  });

  it("should not recognize the plugin validator in an instance created without the plugin", async () => {
    const emailSchema = sWithoutPlugin.string({
      validate: { isEmail: true },
    });
    // This should pass validation because the unknown `isEmail` rule is ignored.
    await expect(emailSchema.parse("not-an-email")).resolves.toBe(
      "not-an-email"
    );
  });
});
