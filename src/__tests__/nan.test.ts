import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../types.js";

describe("NaN Validator", () => {
  it("should validate NaN", async () => {
    const schema = s.nan();
    await expect(schema.parse(NaN)).resolves.toBeNaN();
  });

  it("should throw for a non-NaN value", async () => {
    const schema = s.nan();
    await expect((schema as any).parse(123)).rejects.toThrow(ValidationError);
    await expect((schema as any).parse("hello")).rejects.toThrow(
      ValidationError
    );
    await expect((schema as any).parse(null)).rejects.toThrow(ValidationError);
    await expect((schema as any).parse(undefined)).rejects.toThrow(
      ValidationError
    );
    await expect((schema as any).parse({})).rejects.toThrow(ValidationError);
  });
});
