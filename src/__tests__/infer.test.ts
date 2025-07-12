import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("s.infer", () => {
  it("should correctly infer types from schemas", () => {
    // This is a compile-time test. If it builds, it works.
    const stringSchema = s.string();
    type StringType = s.infer<typeof stringSchema>;
    const stringData: StringType = "hello";
    expect(typeof stringData).toBe("string");

    const numberSchema = s.number();
    type NumberType = s.infer<typeof numberSchema>;
    const numberData: NumberType = 123;
    expect(typeof numberData).toBe("number");

    const booleanSchema = s.boolean();
    type BooleanType = s.infer<typeof booleanSchema>;
    const booleanData: BooleanType = true;
    expect(typeof booleanData).toBe("boolean");

    const dateSchema = s.date();
    type DateType = s.infer<typeof dateSchema>;
    const dateData: DateType = new Date();
    expect(dateData).toBeInstanceOf(Date);

    const objectSchema = s.object({
      validate: {
        properties: { name: s.string(), age: s.number() },
      },
    });
    type ObjectType = s.infer<typeof objectSchema>;
    const objectData: ObjectType = { name: "test", age: 30 };
    expect(typeof objectData).toBe("object");

    const arraySchema = s.array({ validate: { ofType: s.string() } });
    type ArrayType = s.infer<typeof arraySchema>;
    const arrayData: ArrayType = ["a", "b"];
    expect(Array.isArray(arrayData)).toBe(true);

    const unionSchema = s.union({
      validate: {
        ofType: [s.string(), s.number()],
      },
    });
    type UnionType = s.infer<typeof unionSchema>;
    const unionData1: UnionType = "string";
    const unionData2: UnionType = 123;
    expect(typeof unionData1).toBe("string");
    expect(typeof unionData2).toBe("number");

    const anySchema = s.any();
    type AnyType = s.infer<typeof anySchema>;
    const anyData: AnyType = { anything: "goes" };
    expect(typeof anyData).toBe("object");
  });
});
