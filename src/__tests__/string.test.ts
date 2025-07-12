import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("String Validators", () => {
  describe("url", () => {
    it("should validate a correct URL", async () => {
      const schema = s.string({ url: true });
      await expect(schema.parse("https://google.com")).resolves.toBe(
        "https://google.com"
      );
      await expect(schema.parse("http://example.com/some/path")).resolves.toBe(
        "http://example.com/some/path"
      );
      await expect(schema.parse("ftp://ftp.example.com")).resolves.toBe(
        "ftp://ftp.example.com"
      );
    });

    it("should throw an error for an invalid URL", async () => {
      const schema = s.string({ url: true });
      await expect(schema.parse("google-com")).rejects.toThrow();
      await expect(schema.parse("not a url")).rejects.toThrow();
    });

    it("should validate a non-URL when url is false", async () => {
      const schema = s.string({ url: false });
      await expect(schema.parse("not a url")).resolves.toBe("not a url");
    });

    it("should throw an error for a URL when url is false", async () => {
      const schema = s.string({ url: false });
      await expect(schema.parse("https://google.com")).rejects.toThrow();
    });
  });

  describe("cuid", () => {
    it("should validate a correct CUID", async () => {
      const schema = s.string({ cuid: true });
      await expect(schema.parse("caaaaaaaaaaaaaaaaaaaaaaaa")).resolves.toBe(
        "caaaaaaaaaaaaaaaaaaaaaaaa"
      );
    });

    it("should throw an error for an invalid CUID", async () => {
      const schema = s.string({ cuid: true });
      await expect(schema.parse("not a cuid")).rejects.toThrow();
    });

    it("should validate a non-CUID when cuid is false", async () => {
      const schema = s.string({ cuid: false });
      await expect(schema.parse("not a cuid")).resolves.toBe("not a cuid");
    });

    it("should throw an error for a CUID when cuid is false", async () => {
      const schema = s.string({ cuid: false });
      await expect(schema.parse("caaaaaaaaaaaaaaaaaaaaaaaa")).rejects.toThrow();
    });
  });

  describe("cuid2", () => {
    it("should validate a correct CUID2", async () => {
      const schema = s.string({ cuid2: true });
      await expect(schema.parse("cky2y1x0w9v8u7t6s5r4q3p2o1")).resolves.toBe(
        "cky2y1x0w9v8u7t6s5r4q3p2o1"
      );
    });

    it("should throw an error for an invalid CUID2", async () => {
      const schema = s.string({ cuid2: true });
      await expect(schema.parse("123")).rejects.toThrow();
    });

    it("should validate a non-CUID2 when cuid2 is false", async () => {
      const schema = s.string({ cuid2: false });
      await expect(schema.parse("123")).resolves.toBe("123");
    });

    it("should throw an error for a CUID2 when cuid2 is false", async () => {
      const schema = s.string({ cuid2: false });
      await expect(
        schema.parse("cky2y1x0w9v8u7t6s5r4q3p2o1")
      ).rejects.toThrow();
    });
  });

  describe("ulid", () => {
    it("should validate a correct ULID", async () => {
      const schema = s.string({ ulid: true });
      await expect(schema.parse("01H8XGJWBWBAQ4JDB3A4S9A1Z7")).resolves.toBe(
        "01H8XGJWBWBAQ4JDB3A4S9A1Z7"
      );
    });

    it("should throw an error for an invalid ULID", async () => {
      const schema = s.string({ ulid: true });
      await expect(schema.parse("not a ulid")).rejects.toThrow();
    });

    it("should validate a non-ULID when ulid is false", async () => {
      const schema = s.string({ ulid: false });
      await expect(schema.parse("not a ulid")).resolves.toBe("not a ulid");
    });

    it("should throw an error for a ULID when ulid is false", async () => {
      const schema = s.string({ ulid: false });
      await expect(
        schema.parse("01H8XGJWBWBAQ4JDB3A4S9A1Z7")
      ).rejects.toThrow();
    });
  });

  describe("uuidV7", () => {
    it("should validate a correct UUIDv7", async () => {
      const schema = s.string({ uuidV7: true });
      await expect(
        schema.parse("00000000-0000-7000-8000-000000000000")
      ).resolves.toBe("00000000-0000-7000-8000-000000000000");

      await expect(
        schema.parse("0197fc50-9d92-7b83-a45f-60be0e29b306")
      ).resolves.toBe("0197fc50-9d92-7b83-a45f-60be0e29b306");

      await expect(
        schema.parse("0197fc50-cb31-7865-af3a-6ecc6ab2aeb7")
      ).resolves.toBe("0197fc50-cb31-7865-af3a-6ecc6ab2aeb7");
    });

    it("should throw an error for an invalid UUIDv7", async () => {
      const schema = s.string({ uuidV7: true });
      // Invalid version (should be 7)
      await expect(
        schema.parse("00000000-0000-4000-8000-000000000000")
      ).rejects.toThrow();
      // Invalid variant (should be 8, 9, a, or b)
      await expect(
        schema.parse("00000000-0000-7000-c000-000000000000")
      ).rejects.toThrow();
      await expect(schema.parse("not a uuidv7")).rejects.toThrow();
    });

    it("should validate a non-UUIDv7 when uuidV7 is false", async () => {
      const schema = s.string({ uuidV7: false });
      await expect(schema.parse("not a uuidv7")).resolves.toBe("not a uuidv7");
    });

    it("should throw an error for a UUIDv7 when uuidV7 is false", async () => {
      const schema = s.string({ uuidV7: false });
      await expect(
        schema.parse("00000000-0000-7000-8000-000000000000")
      ).rejects.toThrow();
    });
  });

  describe("emoji", () => {
    it("should validate a correct emoji", async () => {
      const schema = s.string({ emoji: true });
      await expect(schema.parse("👍")).resolves.toBe("👍");
    });

    it("should throw an error for an invalid emoji", async () => {
      const schema = s.string({ emoji: true });
      await expect(schema.parse("not an emoji")).rejects.toThrow();
    });

    it("should validate a non-emoji when emoji is false", async () => {
      const schema = s.string({ emoji: false });
      await expect(schema.parse("not an emoji")).resolves.toBe("not an emoji");
    });

    it("should throw an error for an emoji when emoji is false", async () => {
      const schema = s.string({ emoji: false });
      await expect(schema.parse("👍")).rejects.toThrow();
    });
  });

  describe("ipv4", () => {
    it("should validate a correct IPv4 address", async () => {
      const schema = s.string({ ipv4: true });
      await expect(schema.parse("192.168.1.1")).resolves.toBe("192.168.1.1");
    });

    it("should throw an error for an invalid IPv4 address", async () => {
      const schema = s.string({ ipv4: true });
      await expect(schema.parse("999.999.999.999")).rejects.toThrow();
    });

    it("should validate a non-IPv4 address when ipv4 is false", async () => {
      const schema = s.string({ ipv4: false });
      await expect(schema.parse("999.999.999.999")).resolves.toBe(
        "999.999.999.999"
      );
    });

    it("should throw an error for an IPv4 address when ipv4 is false", async () => {
      const schema = s.string({ ipv4: false });
      await expect(schema.parse("192.168.1.1")).rejects.toThrow();
    });
  });

  describe("ipv4Cidr", () => {
    it("should validate a correct IPv4 CIDR block", async () => {
      const schema = s.string({ ipv4Cidr: true });
      await expect(schema.parse("192.168.1.0/24")).resolves.toBe(
        "192.168.1.0/24"
      );
    });

    it("should throw an error for an invalid IPv4 CIDR block", async () => {
      const schema = s.string({ ipv4Cidr: true });
      await expect(schema.parse("192.168.1.0")).rejects.toThrow();
    });

    it("should validate a non-IPv4 CIDR block when ipv4Cidr is false", async () => {
      const schema = s.string({ ipv4Cidr: false });
      await expect(schema.parse("192.168.1.0")).resolves.toBe("192.168.1.0");
    });

    it("should throw an error for an IPv4 CIDR block when ipv4Cidr is false", async () => {
      const schema = s.string({ ipv4Cidr: false });
      await expect(schema.parse("192.168.1.0/24")).rejects.toThrow();
    });
  });

  describe("ipv6", () => {
    it("should validate a correct IPv6 address", async () => {
      const schema = s.string({ ipv6: true });
      await expect(
        schema.parse("2001:0db8:85a3:0000:0000:8a2e:0370:7334")
      ).resolves.toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    });

    it("should throw an error for an invalid IPv6 address", async () => {
      const schema = s.string({ ipv6: true });
      await expect(schema.parse("not an ipv6")).rejects.toThrow();
    });

    it("should validate a non-IPv6 address when ipv6 is false", async () => {
      const schema = s.string({ ipv6: false });
      await expect(schema.parse("not an ipv6")).resolves.toBe("not an ipv6");
    });

    it("should throw an error for an IPv6 address when ipv6 is false", async () => {
      const schema = s.string({ ipv6: false });
      await expect(
        schema.parse("2001:0db8:85a3:0000:0000:8a2e:0370:7334")
      ).rejects.toThrow();
    });
  });

  describe("ipv6Cidr", () => {
    it("should validate a correct IPv6 CIDR block", async () => {
      const schema = s.string({ ipv6Cidr: true });
      await expect(schema.parse("2001:db8::/32")).resolves.toBe(
        "2001:db8::/32"
      );
    });

    it("should throw an error for an invalid IPv6 CIDR block", async () => {
      const schema = s.string({ ipv6Cidr: true });
      await expect(schema.parse("2001:db8::")).rejects.toThrow();
    });

    it("should validate a non-IPv6 CIDR block when ipv6Cidr is false", async () => {
      const schema = s.string({ ipv6Cidr: false });
      await expect(schema.parse("2001:db8::")).resolves.toBe("2001:db8::");
    });

    it("should throw an error for an IPv6 CIDR block when ipv6Cidr is false", async () => {
      const schema = s.string({ ipv6Cidr: false });
      await expect(schema.parse("2001:db8::/32")).rejects.toThrow();
    });
  });

  describe("base64", () => {
    it("should validate a correct base64 string", async () => {
      const schema = s.string({ base64: true });
      await expect(schema.parse("SGVsbG8gV29ybGQ=")).resolves.toBe(
        "SGVsbG8gV29ybGQ="
      );
    });

    it("should throw an error for an invalid base64 string", async () => {
      const schema = s.string({ base64: true });
      await expect(schema.parse("not base64")).rejects.toThrow();
    });

    it("should validate a non-base64 string when base64 is false", async () => {
      const schema = s.string({ base64: false });
      await expect(schema.parse("not base64")).resolves.toBe("not base64");
    });

    it("should throw an error for a base64 string when base64 is false", async () => {
      const schema = s.string({ base64: false });
      await expect(schema.parse("SGVsbG8gV29ybGQ=")).rejects.toThrow();
    });
  });

  describe("base64Url", () => {
    it("should validate a correct base64url string", async () => {
      const schema = s.string({ base64Url: true });
      await expect(schema.parse("SGVsbG8gV29ybGQ")).resolves.toBe(
        "SGVsbG8gV29ybGQ"
      );
    });

    it("should throw an error for an invalid base64url string", async () => {
      const schema = s.string({ base64Url: true });
      await expect(schema.parse("SGVsbG8gV29ybGQ+")).rejects.toThrow();
    });

    it("should validate a non-base64url string when base64Url is false", async () => {
      const schema = s.string({ base64Url: false });
      await expect(schema.parse("SGVsbG8gV29ybGQ+")).resolves.toBe(
        "SGVsbG8gV29ybGQ+"
      );
    });

    it("should throw an error for a base64url string when base64Url is false", async () => {
      const schema = s.string({ base64Url: false });
      await expect(schema.parse("SGVsbG8gV29ybGQ")).rejects.toThrow();
    });
  });

  describe("date", () => {
    it("should validate a correct ISO 8601 date string", async () => {
      const schema = s.string({ date: true });
      await expect(schema.parse("2023-01-01")).resolves.toBe("2023-01-01");
    });

    it("should throw an error for an invalid ISO 8601 date string", async () => {
      const schema = s.string({ date: true });
      await expect(schema.parse("2023/01/01")).rejects.toThrow();
    });

    it("should validate a non-date string when date is false", async () => {
      const schema = s.string({ date: false });
      await expect(schema.parse("2023/01/01")).resolves.toBe("2023/01/01");
    });

    it("should throw an error for a date string when date is false", async () => {
      const schema = s.string({ date: false });
      await expect(schema.parse("2023-01-01")).rejects.toThrow();
    });
  });

  describe("time", () => {
    it("should validate a correct ISO 8601 time string", async () => {
      const schema = s.string({ time: true });
      await expect(schema.parse("12:34:56")).resolves.toBe("12:34:56");
    });

    it("should throw an error for an invalid ISO 8601 time string", async () => {
      const schema = s.string({ time: true });
      await expect(schema.parse("12-34-56")).rejects.toThrow();
    });

    it("should validate a non-time string when time is false", async () => {
      const schema = s.string({ time: false });
      await expect(schema.parse("12-34-56")).resolves.toBe("12-34-56");
    });

    it("should throw an error for a time string when time is false", async () => {
      const schema = s.string({ time: false });
      await expect(schema.parse("12:34:56")).rejects.toThrow();
    });
  });

  describe("duration", () => {
    it("should validate a correct ISO 8601 duration string", async () => {
      const schema = s.string({ duration: true });
      await expect(schema.parse("P3Y6M4DT12H30M5S")).resolves.toBe(
        "P3Y6M4DT12H30M5S"
      );
    });

    it("should throw an error for an invalid ISO 8601 duration string", async () => {
      const schema = s.string({ duration: true });
      await expect(schema.parse("3Y6M4DT12H30M5S")).rejects.toThrow();
    });

    it("should validate a non-duration string when duration is false", async () => {
      const schema = s.string({ duration: false });
      await expect(schema.parse("3Y6M4DT12H30M5S")).resolves.toBe(
        "3Y6M4DT12H30M5S"
      );
    });

    it("should throw an error for a duration string when duration is false", async () => {
      const schema = s.string({ duration: false });
      await expect(schema.parse("P3Y6M4DT12H30M5S")).rejects.toThrow();
    });
  });

  describe("hexColor", () => {
    it("should validate a correct hex color string", async () => {
      const schema = s.string({ hexColor: true });
      await expect(schema.parse("#ff0000")).resolves.toBe("#ff0000");
      await expect(schema.parse("#f00")).resolves.toBe("#f00");
    });

    it("should throw an error for an invalid hex color string", async () => {
      const schema = s.string({ hexColor: true });
      await expect(schema.parse("#ff000")).rejects.toThrow();
    });

    it("should validate a non-hex color string when hexColor is false", async () => {
      const schema = s.string({ hexColor: false });
      await expect(schema.parse("#ff000")).resolves.toBe("#ff000");
    });

    it("should throw an error for a hex color string when hexColor is false", async () => {
      const schema = s.string({ hexColor: false });
      await expect(schema.parse("#ff0000")).rejects.toThrow();
    });
  });

  describe("semver", () => {
    it("should validate a correct semver string", async () => {
      const schema = s.string({ semver: true });
      await expect(schema.parse("1.2.3")).resolves.toBe("1.2.3");
      await expect(schema.parse("1.2.3-alpha.1")).resolves.toBe(
        "1.2.3-alpha.1"
      );
    });

    it("should throw an error for an invalid semver string", async () => {
      const schema = s.string({ semver: true });
      await expect(schema.parse("1.2")).rejects.toThrow();
    });

    it("should validate a non-semver string when semver is false", async () => {
      const schema = s.string({ semver: false });
      await expect(schema.parse("1.2")).resolves.toBe("1.2");
    });

    it("should throw an error for a semver string when semver is false", async () => {
      const schema = s.string({ semver: false });
      await expect(schema.parse("1.2.3")).rejects.toThrow();
    });
  });

  describe("uuid", () => {
    it("should validate a correct UUID", async () => {
      const schema = s.string({ uuid: true });
      await expect(
        schema.parse("f47ac10b-58cc-4372-a567-0e02b2c3d479")
      ).resolves.toBe("f47ac10b-58cc-4372-a567-0e02b2c3d479");
      await expect(
        schema.parse("123e4567-e89b-12d3-a456-426614174000")
      ).resolves.toBe("123e4567-e89b-12d3-a456-426614174000");
    });

    it("should throw an error for an invalid UUID", async () => {
      const schema = s.string({ uuid: true });
      await expect(schema.parse("not-a-uuid")).rejects.toThrow();
      await expect(
        schema.parse("f47ac10b-58cc-4372-a567-0e02b2c3d479a")
      ).rejects.toThrow();
    });

    it("should validate a non-UUID when uuid is false", async () => {
      const schema = s.string({ uuid: false });
      await expect(schema.parse("not-a-uuid")).resolves.toBe("not-a-uuid");
    });

    it("should throw an error for a UUID when uuid is false", async () => {
      const schema = s.string({ uuid: false });
      await expect(
        schema.parse("f47ac10b-58cc-4372-a567-0e02b2c3d479")
      ).rejects.toThrow();
    });
  });

  describe("datetime", () => {
    it("should validate a correct ISO 8601 datetime string", async () => {
      const schema = s.string({ datetime: true });
      await expect(schema.parse("2023-10-27T10:00:00Z")).resolves.toBe(
        "2023-10-27T10:00:00Z"
      );
      await expect(schema.parse("2023-10-27T10:00:00.123Z")).resolves.toBe(
        "2023-10-27T10:00:00.123Z"
      );
      await expect(schema.parse("2023-10-27T10:00:00+05:30")).resolves.toBe(
        "2023-10-27T10:00:00+05:30"
      );
    });

    it("should throw an error for an invalid ISO 8601 datetime string", async () => {
      const schema = s.string({ datetime: true });
      await expect(schema.parse("2023-10-27 10:00:00")).rejects.toThrow();
      await expect(schema.parse("not-a-datetime")).rejects.toThrow();
    });

    it("should validate a non-datetime string when datetime is false", async () => {
      const schema = s.string({ datetime: false });
      await expect(schema.parse("2023-10-27 10:00:00")).resolves.toBe(
        "2023-10-27 10:00:00"
      );
    });

    it("should throw an error for a datetime string when datetime is false", async () => {
      const schema = s.string({ datetime: false });
      await expect(schema.parse("2023-10-27T10:00:00Z")).rejects.toThrow();
    });
  });
});
