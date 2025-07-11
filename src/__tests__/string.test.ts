import { describe, it, expect } from "vitest";
import { s } from "../index.js";

describe("String Validators", () => {
  describe("url", () => {
    it("should validate a correct URL", () => {
      const schema = s.string({ url: true });
      expect(() => schema.parse("https://google.com")).not.toThrow();
      expect(() => schema.parse("http://example.com/some/path")).not.toThrow();
      expect(() => schema.parse("ftp://ftp.example.com")).not.toThrow();
    });

    it("should throw an error for an invalid URL", () => {
      const schema = s.string({ url: true });
      expect(() => schema.parse("google")).toThrow();
      expect(() => schema.parse("not a url")).toThrow();
    });

    it("should validate a non-URL when url is false", () => {
      const schema = s.string({ url: false });
      expect(() => schema.parse("not a url")).not.toThrow();
    });

    it("should throw an error for a URL when url is false", () => {
      const schema = s.string({ url: false });
      expect(() => schema.parse("https://google.com")).toThrow();
    });
  });

  describe("cuid", () => {
    it("should validate a correct CUID", () => {
      const schema = s.string({ cuid: true });
      expect(() => schema.parse("caaaaaaaaaaaaaaaaaaaaaaaa")).not.toThrow();
      expect(() => schema.parse("c3z2y1x0w9v8u7t6s5r4q32o1")).not.toThrow();
    });

    it("should throw an error for an invalid CUID", () => {
      const schema = s.string({ cuid: true });
      expect(() => schema.parse("not a cuid")).toThrow();
    });

    it("should validate a non-CUID when cuid is false", () => {
      const schema = s.string({ cuid: false });
      expect(() => schema.parse("not a cuid")).not.toThrow();
    });

    it("should throw an error for a CUID when cuid is false", () => {
      const schema = s.string({ cuid: false });
      expect(() => schema.parse("caaaaaaaaaaaaaaaaaaaaaaaa")).toThrow();
    });
  });

  describe("cuid2", () => {
    it("should validate a correct CUID2", () => {
      const schema = s.string({ cuid2: true });
      expect(() => schema.parse("cky2y1x0w9v8u7t6s5r4q3p2o1")).not.toThrow();
    });

    it("should throw an error for an invalid CUID2", () => {
      const schema = s.string({ cuid2: true });
      expect(() => schema.parse("123")).toThrow();
    });

    it("should validate a non-CUID2 when cuid2 is false", () => {
      const schema = s.string({ cuid2: false });
      expect(() => schema.parse("123")).not.toThrow();
    });

    it("should throw an error for a CUID2 when cuid2 is false", () => {
      const schema = s.string({ cuid2: false });
      expect(() => schema.parse("cky2y1x0w9v8u7t6s5r4q3p2o1")).toThrow();
    });
  });

  describe("ulid", () => {
    it("should validate a correct ULID", () => {
      const schema = s.string({ ulid: true });
      expect(() => schema.parse("01H8XGJWBWBAQ4JDB3A4S9A1Z7")).not.toThrow();
    });

    it("should throw an error for an invalid ULID", () => {
      const schema = s.string({ ulid: true });
      expect(() => schema.parse("not a ulid")).toThrow();
    });

    it("should validate a non-ULID when ulid is false", () => {
      const schema = s.string({ ulid: false });
      expect(() => schema.parse("not a ulid")).not.toThrow();
    });

    it("should throw an error for a ULID when ulid is false", () => {
      const schema = s.string({ ulid: false });
      expect(() => schema.parse("01H8XGJWBWBAQ4JDB3A4S9A1Z7")).toThrow();
    });
  });

  describe("emoji", () => {
    it("should validate a correct emoji", () => {
      const schema = s.string({ emoji: true });
      expect(() => schema.parse("👍")).not.toThrow();
    });

    it("should throw an error for an invalid emoji", () => {
      const schema = s.string({ emoji: true });
      expect(() => schema.parse("not an emoji")).toThrow();
    });

    it("should validate a non-emoji when emoji is false", () => {
      const schema = s.string({ emoji: false });
      expect(() => schema.parse("not an emoji")).not.toThrow();
    });

    it("should throw an error for an emoji when emoji is false", () => {
      const schema = s.string({ emoji: false });
      expect(() => schema.parse("👍")).toThrow();
    });
  });

  describe("ipv4", () => {
    it("should validate a correct IPv4 address", () => {
      const schema = s.string({ ipv4: true });
      expect(() => schema.parse("192.168.1.1")).not.toThrow();
    });

    it("should throw an error for an invalid IPv4 address", () => {
      const schema = s.string({ ipv4: true });
      expect(() => schema.parse("999.999.999.999")).toThrow();
    });

    it("should validate a non-IPv4 address when ipv4 is false", () => {
      const schema = s.string({ ipv4: false });
      expect(() => schema.parse("999.999.999.999")).not.toThrow();
    });

    it("should throw an error for an IPv4 address when ipv4 is false", () => {
      const schema = s.string({ ipv4: false });
      expect(() => schema.parse("192.168.1.1")).toThrow();
    });
  });

  describe("ipv4Cidr", () => {
    it("should validate a correct IPv4 CIDR block", () => {
      const schema = s.string({ ipv4Cidr: true });
      expect(() => schema.parse("192.168.1.0/24")).not.toThrow();
    });

    it("should throw an error for an invalid IPv4 CIDR block", () => {
      const schema = s.string({ ipv4Cidr: true });
      expect(() => schema.parse("192.168.1.0")).toThrow();
    });

    it("should validate a non-IPv4 CIDR block when ipv4Cidr is false", () => {
      const schema = s.string({ ipv4Cidr: false });
      expect(() => schema.parse("192.168.1.0")).not.toThrow();
    });

    it("should throw an error for an IPv4 CIDR block when ipv4Cidr is false", () => {
      const schema = s.string({ ipv4Cidr: false });
      expect(() => schema.parse("192.168.1.0/24")).toThrow();
    });
  });

  describe("ipv6", () => {
    it("should validate a correct IPv6 address", () => {
      const schema = s.string({ ipv6: true });
      expect(() =>
        schema.parse("2001:0db8:85a3:0000:0000:8a2e:0370:7334")
      ).not.toThrow();
    });

    it("should throw an error for an invalid IPv6 address", () => {
      const schema = s.string({ ipv6: true });
      expect(() => schema.parse("not an ipv6")).toThrow();
    });

    it("should validate a non-IPv6 address when ipv6 is false", () => {
      const schema = s.string({ ipv6: false });
      expect(() => schema.parse("not an ipv6")).not.toThrow();
    });

    it("should throw an error for an IPv6 address when ipv6 is false", () => {
      const schema = s.string({ ipv6: false });
      expect(() =>
        schema.parse("2001:0db8:85a3:0000:0000:8a2e:0370:7334")
      ).toThrow();
    });
  });

  describe("ipv6Cidr", () => {
    it("should validate a correct IPv6 CIDR block", () => {
      const schema = s.string({ ipv6Cidr: true });
      expect(() => schema.parse("2001:db8::/32")).not.toThrow();
    });

    it("should throw an error for an invalid IPv6 CIDR block", () => {
      const schema = s.string({ ipv6Cidr: true });
      expect(() => schema.parse("2001:db8::")).toThrow();
    });

    it("should validate a non-IPv6 CIDR block when ipv6Cidr is false", () => {
      const schema = s.string({ ipv6Cidr: false });
      expect(() => schema.parse("2001:db8::")).not.toThrow();
    });

    it("should throw an error for an IPv6 CIDR block when ipv6Cidr is false", () => {
      const schema = s.string({ ipv6Cidr: false });
      expect(() => schema.parse("2001:db8::/32")).toThrow();
    });
  });

  describe("base64", () => {
    it("should validate a correct base64 string", () => {
      const schema = s.string({ base64: true });
      expect(() => schema.parse("SGVsbG8gV29ybGQ=")).not.toThrow();
    });

    it("should throw an error for an invalid base64 string", () => {
      const schema = s.string({ base64: true });
      expect(() => schema.parse("not base64")).toThrow();
    });

    it("should validate a non-base64 string when base64 is false", () => {
      const schema = s.string({ base64: false });
      expect(() => schema.parse("not base64")).not.toThrow();
    });

    it("should throw an error for a base64 string when base64 is false", () => {
      const schema = s.string({ base64: false });
      expect(() => schema.parse("SGVsbG8gV29ybGQ=")).toThrow();
    });
  });

  describe("base64Url", () => {
    it("should validate a correct base64url string", () => {
      const schema = s.string({ base64Url: true });
      expect(() => schema.parse("SGVsbG8gV29ybGQ")).not.toThrow();
    });

    it("should throw an error for an invalid base64url string", () => {
      const schema = s.string({ base64Url: true });
      expect(() => schema.parse("SGVsbG8gV29ybGQ+")).toThrow();
    });

    it("should validate a non-base64url string when base64Url is false", () => {
      const schema = s.string({ base64Url: false });
      expect(() => schema.parse("SGVsbG8gV29ybGQ+")).not.toThrow();
    });

    it("should throw an error for a base64url string when base64Url is false", () => {
      const schema = s.string({ base64Url: false });
      expect(() => schema.parse("SGVsbG8gV29ybGQ")).toThrow();
    });
  });

  describe("date", () => {
    it("should validate a correct ISO 8601 date string", () => {
      const schema = s.string({ date: true });
      expect(() => schema.parse("2023-01-01")).not.toThrow();
    });

    it("should throw an error for an invalid ISO 8601 date string", () => {
      const schema = s.string({ date: true });
      expect(() => schema.parse("2023/01/01")).toThrow();
    });

    it("should validate a non-date string when date is false", () => {
      const schema = s.string({ date: false });
      expect(() => schema.parse("2023/01/01")).not.toThrow();
    });

    it("should throw an error for a date string when date is false", () => {
      const schema = s.string({ date: false });
      expect(() => schema.parse("2023-01-01")).toThrow();
    });
  });

  describe("time", () => {
    it("should validate a correct ISO 8601 time string", () => {
      const schema = s.string({ time: true });
      expect(() => schema.parse("12:34:56")).not.toThrow();
    });

    it("should throw an error for an invalid ISO 8601 time string", () => {
      const schema = s.string({ time: true });
      expect(() => schema.parse("12-34-56")).toThrow();
    });

    it("should validate a non-time string when time is false", () => {
      const schema = s.string({ time: false });
      expect(() => schema.parse("12-34-56")).not.toThrow();
    });

    it("should throw an error for a time string when time is false", () => {
      const schema = s.string({ time: false });
      expect(() => schema.parse("12:34:56")).toThrow();
    });
  });

  describe("duration", () => {
    it("should validate a correct ISO 8601 duration string", () => {
      const schema = s.string({ duration: true });
      expect(() => schema.parse("P3Y6M4DT12H30M5S")).not.toThrow();
    });

    it("should throw an error for an invalid ISO 8601 duration string", () => {
      const schema = s.string({ duration: true });
      expect(() => schema.parse("3Y6M4DT12H30M5S")).toThrow();
    });

    it("should validate a non-duration string when duration is false", () => {
      const schema = s.string({ duration: false });
      expect(() => schema.parse("3Y6M4DT12H30M5S")).not.toThrow();
    });

    it("should throw an error for a duration string when duration is false", () => {
      const schema = s.string({ duration: false });
      expect(() => schema.parse("P3Y6M4DT12H30M5S")).toThrow();
    });
  });

  describe("hexColor", () => {
    it("should validate a correct hex color string", () => {
      const schema = s.string({ hexColor: true });
      expect(() => schema.parse("#ff0000")).not.toThrow();
      expect(() => schema.parse("#f00")).not.toThrow();
    });

    it("should throw an error for an invalid hex color string", () => {
      const schema = s.string({ hexColor: true });
      expect(() => schema.parse("#ff000")).toThrow();
    });

    it("should validate a non-hex color string when hexColor is false", () => {
      const schema = s.string({ hexColor: false });
      expect(() => schema.parse("#ff000")).not.toThrow();
    });

    it("should throw an error for a hex color string when hexColor is false", () => {
      const schema = s.string({ hexColor: false });
      expect(() => schema.parse("#ff0000")).toThrow();
    });
  });

  describe("semver", () => {
    it("should validate a correct semver string", () => {
      const schema = s.string({ semver: true });
      expect(() => schema.parse("1.2.3")).not.toThrow();
      expect(() => schema.parse("1.2.3-alpha.1")).not.toThrow();
    });

    it("should throw an error for an invalid semver string", () => {
      const schema = s.string({ semver: true });
      expect(() => schema.parse("1.2")).toThrow();
    });

    it("should validate a non-semver string when semver is false", () => {
      const schema = s.string({ semver: false });
      expect(() => schema.parse("1.2")).not.toThrow();
    });

    it("should throw an error for a semver string when semver is false", () => {
      const schema = s.string({ semver: false });
      expect(() => schema.parse("1.2.3")).toThrow();
    });
  });

  describe("uuid", () => {
    it("should validate a correct UUID", () => {
      const schema = s.string({ uuid: true });
      expect(() =>
        schema.parse("f47ac10b-58cc-4372-a567-0e02b2c3d479")
      ).not.toThrow();
      expect(() =>
        schema.parse("123e4567-e89b-12d3-a456-426614174000")
      ).not.toThrow();
    });

    it("should throw an error for an invalid UUID", () => {
      const schema = s.string({ uuid: true });
      expect(() => schema.parse("not-a-uuid")).toThrow();
      expect(() =>
        schema.parse("f47ac10b-58cc-4372-a567-0e02b2c3d479a")
      ).toThrow();
    });

    it("should validate a non-UUID when uuid is false", () => {
      const schema = s.string({ uuid: false });
      expect(() => schema.parse("not-a-uuid")).not.toThrow();
    });

    it("should throw an error for a UUID when uuid is false", () => {
      const schema = s.string({ uuid: false });
      expect(() =>
        schema.parse("f47ac10b-58cc-4372-a567-0e02b2c3d479")
      ).toThrow();
    });
  });

  describe("datetime", () => {
    it("should validate a correct ISO 8601 datetime string", () => {
      const schema = s.string({ datetime: true });
      expect(() => schema.parse("2023-10-27T10:00:00Z")).not.toThrow();
      expect(() => schema.parse("2023-10-27T10:00:00.123Z")).not.toThrow();
      expect(() => schema.parse("2023-10-27T10:00:00+05:30")).not.toThrow();
    });

    it("should throw an error for an invalid ISO 8601 datetime string", () => {
      const schema = s.string({ datetime: true });
      expect(() => schema.parse("2023-10-27 10:00:00")).toThrow();
      expect(() => schema.parse("not-a-datetime")).toThrow();
    });

    it("should validate a non-datetime string when datetime is false", () => {
      const schema = s.string({ datetime: false });
      expect(() => schema.parse("2023-10-27 10:00:00")).not.toThrow();
    });

    it("should throw an error for a datetime string when datetime is false", () => {
      const schema = s.string({ datetime: false });
      expect(() => schema.parse("2023-10-27T10:00:00Z")).toThrow();
    });
  });
});
