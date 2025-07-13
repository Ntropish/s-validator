import { describe, it, expect } from "vitest";
import { s } from "../index.js";
import { ValidationError } from "../types.js";

class User {
  constructor(public name: string) {}
}

class Animal {
  constructor(public species: string) {}
}

describe("Instanceof Validator", () => {
  it("should validate an instance of a class", async () => {
    const schema = s.instanceof(User);
    const user = new User("John");
    await expect(schema.parse(user)).resolves.toEqual(user);
  });

  it("should throw for an instance of a different class", async () => {
    const schema = s.instanceof(User);
    const animal = new Animal("Lion");
    await expect(schema.parse(animal as any)).rejects.toThrow(ValidationError);
  });

  it("should throw for a plain object", async () => {
    const schema = s.instanceof(User);
    const plainObject = { name: "John" };
    await expect(schema.parse(plainObject as any)).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw for a primitive value", async () => {
    const schema = s.instanceof(User);
    await expect(schema.parse("a string" as any)).rejects.toThrow(
      ValidationError
    );
    await expect(schema.parse(123 as any)).rejects.toThrow(ValidationError);
    await expect(schema.parse(null as any)).rejects.toThrow(ValidationError);
  });

  it("should respect the optional modifier", async () => {
    const schema = s.instanceof(User, { optional: true });
    await expect(schema.parse(undefined)).resolves.toBeUndefined();
  });

  it("should respect the nullable modifier", async () => {
    const schema = s.instanceof(User, { nullable: true });
    await expect(schema.parse(null)).resolves.toBeNull();
  });

  it("should use a custom error message", async () => {
    const schema = s.instanceof(User, {
      messages: { identity: "Must be a User instance" },
    });
    const animal = new Animal("Tiger");
    try {
      await schema.parse(animal as any);
      // Fail the test if it doesn't throw
      expect.fail("Expected parse to throw a ValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.issues[0].message).toBe("Must be a User instance");
      }
    }
  });
});
