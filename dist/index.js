function x(e) {
  return e;
}
class p extends Error {
  issues;
  constructor(t) {
    super(t[0]?.message || "Validation failed"), this.issues = t, this.name = "ValidationError";
  }
}
const _ = {
  dataType: "any",
  validate: {
    identity: {
      validator: (e) => !0,
      message: (e) => "Invalid value."
      // This should ideally never be reached
    }
  }
}, S = {
  dataType: "array",
  validate: {
    identity: {
      validator: (e) => Array.isArray(e),
      message: (e) => `Invalid type. Expected array, received ${typeof e.value}.`
    },
    length: {
      validator: (e, [t]) => e.length === t,
      message: (e) => `${e.label} must contain exactly ${e.args[0]} items.`
    },
    minLength: {
      validator: (e, [t]) => e.length >= t,
      message: (e) => `${e.label} must contain at least ${e.args[0]} items.`
    },
    maxLength: {
      validator: (e, [t]) => e.length <= t,
      message: (e) => `${e.label} must contain at most ${e.args[0]} items.`
    },
    nonEmpty: {
      validator: (e) => e.length > 0,
      message: (e) => `${e.label} must not be empty.`
    },
    contains: {
      validator: (e, [t]) => e.includes(t),
      message: (e) => `${e.label} must contain the element ${e.args[0]}.`
    },
    excludes: {
      validator: (e, [t]) => !e.includes(t),
      message: (e) => `${e.label} must not contain the element ${e.args[0]}.`
    },
    unique: {
      validator: (e) => new Set(e).size === e.length,
      message: (e) => `${e.label} must contain unique items.`
    },
    ofType: {
      async validator(e, [t], a) {
        for (let s = 0; s < e.length; s++) {
          const r = await t.safeParse(e[s], a.ctx);
          if (r.status === "error") {
            const i = r.error.issues.map((o) => ({
              ...o,
              path: [...a.path, s, ...o.path]
            }));
            throw new p(i);
          }
        }
        return !0;
      },
      message: () => "Invalid item in array."
    },
    items: {
      async validator(e, t, a) {
        if (e.length !== t.length)
          throw new p([
            {
              message: `Expected ${t.length} items, but received ${e.length}.`,
              path: a.path
            }
          ]);
        for (let s = 0; s < t.length; s++) {
          const r = await t[s].safeParse(e[s], a.ctx);
          if (r.status === "error") {
            const i = r.error.issues.map((o) => ({
              ...o,
              path: [...a.path, s, ...o.path]
            }));
            throw new p(i);
          }
        }
        return !0;
      },
      message: () => "Invalid tuple item."
    }
  }
}, V = {
  dataType: "bigint",
  prepare: {
    coerce: (e, [t]) => {
      if (t === !1)
        return e;
      if (typeof e == "string" || typeof e == "number" || typeof e == "boolean")
        try {
          return BigInt(e);
        } catch {
          return e;
        }
      return e;
    }
  },
  validate: {
    identity: {
      validator: (e) => typeof e == "bigint",
      message: (e) => `Invalid type. Expected bigint, received ${typeof e.value}.`
    }
  }
}, D = /* @__PURE__ */ new Set(["true", "1", "yes", "on", "y", "enabled"]), C = /* @__PURE__ */ new Set(["false", "0", "no", "off", "n", "disabled"]), F = {
  dataType: "boolean",
  prepare: {
    coerce: (e, [t]) => t === !1 ? e : !!e,
    stringBool: (e, [t]) => {
      if (t === !1)
        return e;
      if (typeof e == "string") {
        const a = e.toLowerCase();
        if (D.has(a))
          return !0;
        if (C.has(a))
          return !1;
      }
      return e;
    }
  },
  validate: {
    identity: {
      validator: (e) => typeof e == "boolean",
      message: (e) => `Invalid type. Expected boolean, received ${typeof e.value}.`
    },
    required: {
      validator: (e) => typeof e == "boolean",
      message: (e) => `${e.label} is required.`
    }
  }
}, I = {
  dataType: "date",
  prepare: {
    coerce: (e, [t]) => {
      if (t === !1 || e instanceof Date)
        return e;
      if (typeof e == "string" || typeof e == "number") {
        const a = new Date(e);
        if (!isNaN(a.getTime()))
          return a;
      }
      return e;
    }
  },
  validate: {
    identity: {
      validator: (e) => e instanceof Date,
      message: (e) => `Invalid type. Expected Date, received ${typeof e.value}.`
    },
    min: {
      validator: (e, [t]) => e.getTime() >= t.getTime(),
      message: (e) => `${e.label} must be on or after ${new Date(
        e.args[0]
      ).toDateString()}.`
    },
    max: {
      validator: (e, [t]) => e.getTime() <= t.getTime(),
      message: (e) => `${e.label} must be on or before ${new Date(
        e.args[0]
      ).toDateString()}.`
    }
  }
}, j = {
  dataType: "instanceof",
  validate: {
    identity: {
      validator: (e) => typeof e == "object" && e !== null,
      message: (e) => `Invalid type. Expected object, received ${typeof e.value}.`
    },
    constructor: {
      validator: (e, [t]) => e instanceof t,
      message: (e) => `Value must be an instance of ${e.args[0]?.name || "Unknown"}.`
    }
  }
}, z = {
  dataType: "map",
  validate: {
    identity: {
      validator: (e) => e instanceof Map,
      message: (e) => `Invalid type. Expected Map, received ${typeof e.value}.`
    },
    entries: {
      validator: async (e, [t, a], s) => {
        const r = [];
        for (const [i, o] of e.entries()) {
          const n = await t.safeParse(i, s);
          n.status === "error" && r.push(...n.error.issues);
          const l = await a.safeParse(o, s);
          l.status === "error" && r.push(...l.error.issues);
        }
        if (r.length > 0)
          throw new p(r);
        return !0;
      },
      message: (e) => "Map validation failed."
    }
  }
}, N = {
  dataType: "nan",
  validate: {
    identity: {
      validator: (e) => Number.isNaN(e),
      message: (e) => "Value must be NaN."
    }
  }
}, E = {
  dataType: "never",
  validate: {
    identity: {
      validator: (e) => !1,
      message: (e) => "Value must be of type never."
    }
  }
}, M = {
  dataType: "number",
  prepare: {
    coerce: (e, [t]) => t === !1 || typeof e == "number" ? e : typeof e == "string" && /^-?\d+(\.\d+)?$/.test(e) ? parseFloat(e) : e
  },
  validate: {
    identity: {
      validator: (e) => typeof e == "number",
      message: (e) => `Invalid type. Expected number, received ${typeof e.value}.`
    },
    min: {
      validator: (e, [t]) => e >= t,
      message: (e) => `${e.label} must be at least ${e.args[0]}.`
    },
    max: {
      validator: (e, [t]) => e <= t,
      message: (e) => `${e.label} must be at most ${e.args[0]}.`
    },
    gt: {
      validator: (e, [t]) => e > t,
      message: (e) => `${e.label} must be greater than ${e.args[0]}.`
    },
    gte: {
      validator: (e, [t]) => e >= t,
      message: (e) => `${e.label} must be greater than or equal to ${e.args[0]}.`
    },
    lt: {
      validator: (e, [t]) => e < t,
      message: (e) => `${e.label} must be less than ${e.args[0]}.`
    },
    lte: {
      validator: (e, [t]) => e <= t,
      message: (e) => `${e.label} must be less than or equal to ${e.args[0]}.`
    },
    range: {
      validator: (e, [[t, a]]) => e >= t && e <= a,
      message: (e) => `${e.label} must be between ${e.args[0][0]} and ${e.args[0][1]}.`
    },
    exclusiveRange: {
      validator: (e, [[t, a]]) => e > t && e < a,
      message: (e) => `${e.label} must be strictly between ${e.args[0][0]} and ${e.args[0][1]}.`
    },
    multipleOf: {
      validator: (e, [t]) => e % t === 0,
      message: (e) => `${e.label} must be a multiple of ${e.args[0]}.`
    },
    integer: {
      validator: (e, [t]) => t === void 0 || t === !1 ? !0 : Number.isInteger(e),
      message: (e) => `${e.label} must be an integer.`
    },
    safe: {
      validator: (e, [t]) => t === void 0 || t === !1 ? !0 : Number.isSafeInteger(e),
      message: (e) => `${e.label} must be a safe integer.`
    },
    positive: {
      validator: (e) => e > 0,
      message: (e) => `${e.label} must be positive.`
    },
    negative: {
      validator: (e) => e < 0,
      message: (e) => `${e.label} must be negative.`
    }
  }
}, Z = {
  dataType: "object",
  validate: {
    identity: {
      validator: (e) => typeof e == "object" && e !== null && !Array.isArray(e),
      message: (e) => `Invalid type. Expected object, received ${typeof e.value}.`
    }
  }
};
/**
 * @license
 * MIT License
 *
 * Copyright (c) 2022-present, Colin McDonnell
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
const O = {
  /**
   * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L446
   */
  cuid: /^c[a-z0-9]{24}$/i,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/i,
  /**
   * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L343
   */
  email: /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i,
  /**
   * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L391
   */
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  /**
   * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L590
   *
   * @description
   * This is a simplified regex that covers the basic emoji types.
   * For a more comprehensive regex, see the original Zod implementation.
   */
  emoji: new RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u"),
  /**
   * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L529
   */
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  cidrv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(3[0-2]|[12]?[0-9])$/,
  /**
   * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L544
   */
  ipv6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
  cidrv6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[0-1][0-9]|[1-9]?[0-9])$/,
  base64: /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
  base64url: /^[A-Za-z0-9_-]+$/,
  /**
   * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L619
   */
  isoDate: /^(\d{4})-(\d{2})-(\d{2})$/,
  /**
   * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L647
   */
  isoTime: /^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9](\.\d+)?)?$/,
  /**
   * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L694
   */
  isoDateTime: /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
  /**
   * @see https://github.com/colinhacks/zod/blob/master/src/types.ts#L716
   */
  isoDuration: /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/,
  /**
   * @see https://regexr.com/39s32
   */
  hexColor: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
  /**
   * @see https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
   */
  semver: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
  url: /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/i
}, d = {
  ...O,
  cuid2: /^[a-z][a-z0-9]{7,31}$/,
  /**
   * ULID v7, with millisecond precision.
   *
   * @see https://github.com/ulid/spec
   * @see https://github.com/fpotter/ulid-v7
   */
  uuidV7: /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
}, U = {
  dataType: "string",
  prepare: {
    coerce: (e, [t]) => t === !1 || typeof e == "string" || e == null || typeof e == "object" && !e.toString ? e : String(e),
    trim: (e, [t]) => t === !1 ? e : typeof e == "string" ? e.trim() : e,
    toLowerCase: (e, [t]) => t === !1 ? e : typeof e == "string" ? e.toLowerCase() : e
  },
  transform: {
    toUpperCase: (e) => e.toUpperCase(),
    toLowerCase: (e) => e.toLowerCase(),
    trim: (e) => e.trim()
  },
  validate: {
    identity: {
      validator: (e) => typeof e == "string",
      message: (e) => `Invalid type. Expected ${e.dataType}, received ${typeof e.value}.`
    },
    length: {
      validator: (e, [t]) => e.length === t,
      message: (e) => `${e.label} must be exactly ${e.args[0]} characters long.`
    },
    minLength: {
      validator: (e, [t]) => e.length >= t,
      message: (e) => `${e.label} must be at least ${e.args[0]} characters long.`
    },
    maxLength: {
      validator: (e, [t]) => e.length <= t,
      message: (e) => `${e.label} must be at most ${e.args[0]} characters long.`
    },
    range: {
      validator: (e, [t, a]) => e.length >= t && e.length <= a,
      message: (e) => `${e.label} must be between ${e.args[0]} and ${e.args[1]} characters long.`
    },
    exclusiveRange: {
      validator: (e, [t, a]) => e.length > t && e.length < a,
      message: (e) => `${e.label} must be strictly between ${e.args[0]} and ${e.args[1]} characters long.`
    },
    pattern: {
      validator: (e, [t]) => t.test(e),
      message: (e) => `${e.label} does not match the required pattern.`
    },
    oneOf: {
      validator: (e, t) => t.includes(e),
      message: (e) => `${e.label} must be one of the following values: ${e.args.join(
        ", "
      )}`
    },
    cuid: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.cuid.test(e) : !d.cuid.test(e),
      message: (e) => `${e.label} must be a valid CUID.`
    },
    cuid2: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.cuid2.test(e) : !d.cuid2.test(e),
      message: (e) => `${e.label} must be a valid CUID2.`
    },
    ulid: {
      validator: (e, [t = !0]) => t ? d.ulid.test(e) : !d.ulid.test(e),
      message: (e) => `${e.label} must be a valid ULID.`
    },
    emoji: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.emoji.test(e) : !d.emoji.test(e),
      message: (e) => `${e.label} must be a valid emoji.`
    },
    ipv4: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.ipv4.test(e) : !d.ipv4.test(e),
      message: (e) => `${e.label} must be a valid IPv4 address.`
    },
    ipv4Cidr: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.cidrv4.test(e) : !d.cidrv4.test(e),
      message: (e) => `${e.label} must be a valid IPv4 CIDR.`
    },
    ipv6: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.ipv6.test(e) : !d.ipv6.test(e),
      message: (e) => `${e.label} must be a valid IPv6 address.`
    },
    ipv6Cidr: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.cidrv6.test(e) : !d.cidrv6.test(e),
      message: (e) => `${e.label} must be a valid IPv6 CIDR.`
    },
    base64: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.base64.test(e) : !d.base64.test(e),
      message: (e) => `${e.label} must be a valid base64 string.`
    },
    base64Url: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.base64url.test(e) : !d.base64url.test(e),
      message: (e) => `${e.label} must be a valid base64url string.`
    },
    date: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.isoDate.test(e) : !d.isoDate.test(e),
      message: (e) => `${e.label} must be a valid date string.`
    },
    time: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.isoTime.test(e) : !d.isoTime.test(e),
      message: (e) => `${e.label} must be a valid time string.`
    },
    duration: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.isoDuration.test(e) : !d.isoDuration.test(e),
      message: (e) => `${e.label} must be a valid duration string.`
    },
    hexColor: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.hexColor.test(e) : !d.hexColor.test(e),
      message: (e) => `${e.label} must be a valid hex color.`
    },
    semver: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.semver.test(e) : !d.semver.test(e),
      message: (e) => `${e.label} must be a valid semver string.`
    },
    url: {
      validator: (e, [t = !0]) => t ? d.url.test(e) : !d.url.test(e),
      message: (e) => `${e.label} must be a valid URL.`
    },
    uuid: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.uuid.test(e) : !d.uuid.test(e),
      message: (e) => `${e.label} must be a valid UUID.`
    },
    uuidV7: {
      validator: (e, [t = !0]) => t ? d.uuidV7.test(e) : !d.uuidV7.test(e),
      message: (e) => `${e.label} must be a valid UUIDv7.`
    },
    datetime: {
      validator: (e, [t]) => t === void 0 ? !0 : t ? d.isoDateTime.test(e) : !d.isoDateTime.test(e),
      message: (e) => `${e.label} must be a valid datetime string.`
    },
    json: {
      validator: async (e, [t]) => {
        let a;
        try {
          a = JSON.parse(e);
        } catch {
          return !1;
        }
        return t ? (await t.safeParse(a)).status === "success" : !0;
      },
      message: (e) => e.args[0] ? `${e.label} must be a JSON string that conforms to the provided schema.` : `${e.label} must be a valid JSON string.`
    },
    email: {
      validator: (e, [t]) => {
        if (t === void 0 || t === !1)
          return !0;
        if (!d.email.test(e))
          return !1;
        if (typeof t == "object") {
          const a = e.substring(e.lastIndexOf("@") + 1);
          if (t.denied) {
            for (const s of t.denied)
              if (s instanceof RegExp ? s.test(a) : s === a)
                return !1;
          }
          if (t.allowed) {
            for (const s of t.allowed)
              if (s instanceof RegExp ? s.test(a) : s === a)
                return !0;
            return !1;
          }
        }
        return !0;
      },
      message: (e) => `${e.label} must be a valid email address.`
    }
  }
}, R = {
  dataType: "unknown",
  validate: {
    identity: {
      validator: (e) => !0,
      message: (e) => "Invalid value."
    }
  }
}, k = (e) => {
  const t = typeof e;
  return t === "string" || t === "number" || t === "boolean" || e === null;
}, L = {
  dataType: "literal",
  validate: {
    identity: {
      validator: k,
      message: (e) => "Invalid type. Expected a literal value."
    },
    equals: {
      validator: (e, [t]) => e === t,
      message: (e) => `Invalid literal value. Expected ${JSON.stringify(
        e.args[0]
      )}, received ${JSON.stringify(e.value)}`
    }
  }
}, q = {
  dataType: "union",
  validate: {
    identity: {
      validator: () => !0,
      message: () => "is any"
    },
    variants: {
      validator: async (e, t, a) => {
        const s = [];
        for (const r of t)
          try {
            return await r.parse(e, a), !0;
          } catch (i) {
            if (i instanceof p)
              s.push(...i.issues);
            else
              throw i;
          }
        throw new p(s);
      },
      message: (e) => "No union variant matched the provided value."
    }
  }
}, J = {
  dataType: "record",
  validate: {
    identity: {
      validator: (e) => typeof e == "object" && e !== null && !Array.isArray(e),
      message: (e) => `Invalid type. Expected a record object, received ${typeof e.value}.`
    },
    keysAndValues: {
      validator: async (e, [t, a], s) => {
        const r = [];
        for (const [i, o] of Object.entries(e)) {
          const n = await t.safeParse(i, s);
          n.status === "error" && r.push(...n.error.issues);
          const l = await a.safeParse(o, s);
          l.status === "error" && r.push(...l.error.issues);
        }
        if (r.length > 0)
          throw new p(r);
        return !0;
      },
      message: (e) => "Record validation failed."
    }
  }
}, B = {
  dataType: "set",
  validate: {
    identity: {
      validator: (e) => e instanceof Set,
      message: (e) => `Invalid type. Expected set, received ${typeof e.value}.`
    }
  }
}, T = [
  _,
  S,
  V,
  F,
  I,
  j,
  L,
  z,
  N,
  E,
  M,
  Z,
  J,
  U,
  q,
  R,
  B
], $ = {}, P = {}, A = {}, w = {};
for (const e of T) {
  const t = e.dataType;
  if ($[t] = $[t] || {
    identity: (a) => !1
  }, P[t] = P[t] || {}, A[t] = A[t] || {}, w[t] = w[t] || {}, e.prepare)
    for (const a in e.prepare)
      P[t][a] = e.prepare[a];
  if (e.validate)
    for (const a in e.validate) {
      const s = e.validate[a];
      $[t][a] = s.validator, w[t][a] = s.message;
    }
  if (e.transform)
    for (const a in e.transform)
      A[t][a] = e.transform[a];
}
class h {
  validators = [];
  preparations = [];
  customPreparations = [];
  transformations = [];
  customTransformations = [];
  customValidators = [];
  dataType;
  config;
  label;
  "~standard";
  constructor(t, a = {}) {
    this.dataType = t, this.config = a;
    const {
      prepare: s,
      validate: r,
      transform: i,
      // messages, optional, and nullable are read from this.config
      ...o
    } = a;
    this.label = a.label || this.dataType.charAt(0).toUpperCase() + this.dataType.slice(1);
    const n = $[t], l = P[t], c = A[t];
    if (n?.identity && this.validators.push({
      name: "identity",
      validator: n.identity,
      args: []
    }), s)
      for (const [f, u] of Object.entries(s)) {
        if (f === "custom") {
          this.customPreparations = u;
          continue;
        }
        l?.[f] && this.preparations.push({
          name: f,
          preparation: l[f],
          args: [u]
        });
      }
    const m = { ...r || {}, ...o };
    if (m)
      for (let [f, u] of Object.entries(m)) {
        if (f === "custom") {
          this.customValidators = this.customValidators.concat(
            Array.isArray(u) ? u : [u]
          );
          continue;
        }
        u !== !1 && (u === void 0 && (u = !0), n?.[f] && this.validators.push({
          name: f,
          validator: n[f],
          args: Array.isArray(u) ? u : [u]
        }));
      }
    if (i)
      for (const [f, u] of Object.entries(i)) {
        if (f === "custom") {
          this.customTransformations = u;
          continue;
        }
        c?.[f] && this.transformations.push({
          name: f,
          transformation: c[f],
          args: [u]
        });
      }
    this["~standard"] = {
      version: 1,
      vendor: "s-validator",
      validate: async (f) => {
        const u = await this.safeParse(f);
        return u.status === "success" ? { value: u.data } : { issues: u.error.issues.map(
          (v) => ({
            message: v.message,
            path: v.path.map((y) => ({ key: y }))
          })
        ) };
      },
      types: {}
    };
  }
  async _prepare(t) {
    let a = t.value;
    for (const { preparation: s, args: r } of this.preparations)
      a = await s(
        a,
        r,
        { ...t, value: a },
        this
      );
    for (const s of this.customPreparations)
      a = await s(
        a,
        [],
        { ...t, value: a },
        this
      );
    return a;
  }
  async _validate(t, a) {
    const s = [], r = this.config.messages ?? {}, i = t;
    if (this.config.optional && i === void 0) return;
    if (this.config.nullable && i === null) return i;
    const o = this.validators.find(
      (n) => n.name === "identity"
    );
    if (o && !await o.validator(
      i,
      o.args,
      { ...a, value: i },
      this
    )) {
      const n = {
        label: this.label,
        value: i,
        path: a.path,
        dataType: this.dataType,
        ctx: a.ctx,
        args: [],
        schema: this
      };
      let l;
      const c = r.identity;
      if (typeof c == "string")
        l = c;
      else if (typeof c == "function")
        l = c(n);
      else {
        const m = w[this.dataType]?.identity;
        m && (l = m(n));
      }
      if (s.push({
        path: a.path,
        message: l ?? `Validation failed for ${this.dataType}.identity`
      }), s.length > 0)
        throw new p(s);
    }
    for (const { name: n, validator: l, args: c } of this.validators)
      if (n !== "identity")
        try {
          if (!await l(
            i,
            c,
            { ...a, value: i },
            this
          )) {
            const m = {
              label: this.label,
              value: i,
              path: a.path,
              dataType: this.dataType,
              ctx: a.ctx,
              args: c,
              schema: this
            };
            let f;
            const u = r[n];
            if (typeof u == "string")
              f = u;
            else if (typeof u == "function")
              f = u(m);
            else {
              const g = w[this.dataType]?.[n];
              g && (f = g(m));
            }
            s.push({
              path: a.path,
              message: f ?? `Validation failed for ${this.dataType}.${n}`
            });
          }
        } catch (m) {
          if (m instanceof p)
            s.push(...m.issues);
          else
            throw m;
        }
    for (const n of this.customValidators) {
      const l = typeof n == "object" ? n.validator : n, c = typeof n == "object" ? n.message : void 0, m = typeof n == "object" ? n.name : void 0;
      if (!await l(
        i,
        [],
        { ...a, value: i },
        this
      )) {
        const f = {
          label: this.label,
          value: i,
          path: a.path,
          dataType: this.dataType,
          ctx: a.ctx,
          args: [],
          schema: this
        };
        let u = typeof c == "function" ? c(f) : c;
        if (!u) {
          const g = r[m] ?? r.custom;
          if (typeof g == "string")
            u = g;
          else if (typeof g == "function")
            u = g(f);
          else {
            const v = w[this.dataType]?.custom;
            v && (u = v(f));
          }
        }
        s.push({
          path: a.path,
          message: u ?? `Custom validation failed for ${m ?? this.dataType}`
        });
      }
    }
    if (s.length > 0)
      throw new p(s);
    return i;
  }
  async _transform(t, a) {
    let s = t;
    for (const { transformation: r, args: i } of this.transformations)
      s = await r(
        s,
        i,
        { ...a, value: s },
        this
      );
    for (const r of this.customTransformations)
      s = await r(
        s,
        [],
        { ...a, value: s },
        this
      );
    return s;
  }
  async parse(t, a) {
    const s = await this.safeParse(t, a);
    if (s.status === "error")
      throw s.error;
    return s.data;
  }
  async safeParse(t, a) {
    const s = {
      rootData: t,
      path: [],
      value: t,
      ctx: a
    };
    try {
      const r = await this._prepare(s), i = await this._validate(r, {
        ...s,
        value: r
      });
      return { status: "success", data: await this._transform(i, {
        ...s,
        value: i
      }) };
    } catch (r) {
      return r instanceof p ? { status: "error", error: r } : {
        status: "error",
        error: new p([
          {
            message: `Unhandled error in schema: ${r.message}`,
            path: s.path
          }
        ])
      };
    }
  }
  optional() {
    return new h(this.dataType, { ...this.config, optional: !0 });
  }
  nullable() {
    return new h(this.dataType, { ...this.config, nullable: !0 });
  }
  asKey() {
    return this;
  }
}
class H extends h {
  constructor(t) {
    super("switch", t);
  }
  selectCase(t) {
    const {
      select: a,
      cases: s,
      default: r
    } = this.config;
    if (!a || !s)
      return;
    const i = a(t);
    return s[i] || r;
  }
  async _prepare(t) {
    const a = await super._prepare(t), s = this.selectCase({ ...t, value: a });
    return s ? await s._prepare({ ...t, value: a }) : a;
  }
  async _validate(t, a) {
    const s = await super._validate(t, a), r = this.selectCase({ ...a, value: s });
    if (r)
      return await r._validate(s, a);
    const { failOnNoMatch: i } = this.config;
    if (i) {
      const o = this.config.select(a);
      throw new p([
        {
          path: a.path,
          message: `No case matched for key "${o}" and no default was provided.`
        }
      ]);
    }
    return t;
  }
  async _transform(t, a) {
    const s = await super._transform(t, a), r = this.selectCase({ ...a, value: s });
    return r ? await r._transform(s, a) : s;
  }
}
class K extends h {
  itemSchema;
  constructor(t, a) {
    const s = { ...a };
    s.validate?.ofType && delete s.validate.ofType, super("array", s), this.itemSchema = t;
  }
  async _prepare(t) {
    const a = await super._prepare(t);
    if (!Array.isArray(a))
      return a;
    const s = [];
    for (let r = 0; r < a.length; r++) {
      const i = a[r], o = await this.itemSchema._prepare({
        rootData: t.rootData,
        path: [...t.path, r],
        value: i,
        ctx: t.ctx
      });
      s.push(o);
    }
    return s;
  }
  async _validate(t, a) {
    if (this.config.optional && t === void 0)
      return [];
    if (this.config.nullable && t === null)
      return null;
    await super._validate(t, a);
    const s = [], r = [], i = t.map(async (o, n) => {
      const l = {
        rootData: a.rootData,
        path: [...a.path, n],
        value: o,
        ctx: a.ctx
      };
      try {
        const c = await this.itemSchema._validate(o, l);
        r[n] = c;
      } catch (c) {
        if (c instanceof p)
          s.push(...c.issues);
        else
          throw c;
      }
    });
    if (await Promise.all(i), s.length > 0)
      throw new p(s);
    return r;
  }
  async _transform(t, a) {
    const s = await super._transform(t, a);
    if (!Array.isArray(s))
      return s;
    const r = [], i = s.map(async (o, n) => {
      r[n] = await this.itemSchema._transform(o, {
        rootData: a.rootData,
        path: [...a.path, n],
        value: o,
        ctx: a.ctx
      });
    });
    return await Promise.all(i), r;
  }
}
class b extends h {
  constructor(t) {
    super("object", t);
  }
  async _prepare(t) {
    const a = await super._prepare(t);
    if (a == null || typeof a != "object")
      return a;
    const s = this.getProperties(), r = { ...a };
    for (const i in s)
      if (Object.prototype.hasOwnProperty.call(r, i)) {
        const o = s[i];
        r[i] = await o._prepare({
          rootData: t.rootData,
          path: [...t.path, i],
          value: r[i],
          ctx: t.ctx
        });
      }
    return r;
  }
  async _validate(t, a) {
    if (this.config.optional && t === void 0)
      return;
    if (this.config.nullable && t === null)
      return null;
    await super._validate(t, a);
    const s = this.getProperties(), r = this.config.strict, i = [], o = {}, n = Object.keys(s).map(async (l) => {
      const c = s[l], m = t[l], f = {
        rootData: a.rootData,
        path: [...a.path, l],
        value: m,
        ctx: a.ctx
      };
      try {
        if (Object.prototype.hasOwnProperty.call(t, l)) {
          const u = await c._validate(
            m,
            f
          );
          o[l] = u;
        } else c.config.optional || i.push({
          path: f.path,
          message: `Required property '${l}' is missing`
        });
      } catch (u) {
        if (u instanceof p)
          i.push(...u.issues);
        else
          throw u;
      }
    });
    if (await Promise.all(n), r)
      for (const l in t)
        s[l] || i.push({
          path: [...a.path, l],
          message: `Unrecognized key: '${l}'`
        });
    else
      for (const l in t)
        s[l] || (o[l] = t[l]);
    if (i.length > 0)
      throw new p(i);
    for (const l of this.customValidators) {
      const c = typeof l == "object" ? l.validator : l, m = typeof l == "object" ? l.message : void 0, f = typeof l == "object" ? l.name : void 0;
      if (!await c(
        o,
        [],
        {
          ...a,
          value: o
        },
        this
      )) {
        const u = this.config.messages ?? {}, g = {
          label: this.label,
          value: o,
          path: a.path,
          dataType: this.dataType,
          ctx: a.ctx,
          args: [],
          schema: this
        };
        let v = typeof m == "function" ? m(g) : m;
        if (!v) {
          const y = u[f] ?? u.custom;
          typeof y == "string" ? v = y : typeof y == "function" && (v = y(g));
        }
        i.push({
          path: a.path,
          message: v ?? `Custom validation failed for ${f ?? this.dataType}`
        });
      }
    }
    if (i.length > 0)
      throw new p(i);
    return o;
  }
  async _transform(t, a) {
    const s = await super._transform(t, a), r = this.getProperties(), i = { ...s }, o = Object.keys(r).map(async (n) => {
      if (Object.prototype.hasOwnProperty.call(i, n)) {
        const l = r[n];
        i[n] = await l._transform(i[n], {
          rootData: a.rootData,
          path: [...a.path, n],
          value: i[n],
          ctx: a.ctx
        });
      }
    });
    return await Promise.all(o), i;
  }
  getProperties() {
    return this.config.validate?.properties ?? {};
  }
  partial() {
    const t = this.getProperties(), a = {};
    for (const r in t)
      a[r] = t[r].optional();
    const s = {
      ...this.config,
      validate: {
        ...this.config.validate,
        properties: a
      }
    };
    return new b(s);
  }
  pick(t) {
    const a = this.getProperties(), s = {};
    for (const i of t)
      a[i] && (s[i] = a[i]);
    const r = {
      ...this.config,
      validate: {
        ...this.config.validate,
        properties: s
      },
      strict: !0
    };
    return new b(r);
  }
  omit(t) {
    const s = { ...this.getProperties() };
    for (const i of t)
      delete s[i];
    const r = {
      ...this.config,
      validate: {
        ...this.config.validate,
        properties: s
      },
      strict: !0
    };
    return new b(r);
  }
  extend(t) {
    const s = { ...this.getProperties(), ...t }, r = {
      ...this.config,
      validate: {
        ...this.config.validate,
        properties: s
      }
    };
    return new b(r);
  }
}
class W extends h {
  valueSchema;
  constructor(t, a = {}) {
    super("set", a), this.valueSchema = t;
  }
  async _prepare(t) {
    const a = await super._prepare(t);
    if (!(a instanceof Set))
      return a;
    const s = /* @__PURE__ */ new Set(), r = Array.from(a).map(
      async (i, o) => {
        const n = await this.valueSchema._prepare({
          rootData: t.rootData,
          path: [...t.path, o],
          value: i,
          ctx: t.ctx
        });
        s.add(n);
      }
    );
    return await Promise.all(r), s;
  }
  async _validate(t, a) {
    if (await super._validate(t, a), this.config.optional && t === void 0)
      return;
    if (this.config.nullable && t === null)
      return null;
    if (!(t instanceof Set))
      return;
    const s = [], r = /* @__PURE__ */ new Set(), i = Array.from(t).map(async (o, n) => {
      const l = {
        rootData: a.rootData,
        path: [...a.path, n],
        value: o,
        ctx: a.ctx
      };
      try {
        const c = await this.valueSchema._validate(
          o,
          l
        );
        r.add(c);
      } catch (c) {
        if (c instanceof p)
          s.push(...c.issues);
        else
          throw c;
      }
    });
    if (await Promise.all(i), s.length > 0)
      throw new p(s);
    return r;
  }
  async _transform(t, a) {
    const s = await super._transform(
      t,
      a
    );
    if (!(s instanceof Set))
      return s;
    const r = /* @__PURE__ */ new Set(), i = Array.from(s).map(
      async (o, n) => {
        const l = await this.valueSchema._transform(o, {
          rootData: a.rootData,
          path: [...a.path, n],
          value: o,
          ctx: a.ctx
        });
        r.add(l);
      }
    );
    return await Promise.all(i), r;
  }
}
class Y extends h {
  variants;
  constructor(t) {
    if (super("union", t), !t.validate?.of)
      throw new Error(
        "Union schema must have variants provided in `validate.of`"
      );
    this.variants = t.validate.of;
  }
  async _validate(t, a) {
    const s = [];
    let r, i = !1;
    for (const o of this.variants)
      try {
        const n = await o.safeParse(t, a.ctx);
        if (n.status === "success") {
          r = n.data, i = !0;
          break;
        } else
          s.push(...n.error.issues);
      } catch (n) {
        if (n instanceof p)
          s.push(...n.issues);
        else
          throw n;
      }
    if (i)
      return r;
    try {
      await super._validate(t, a);
    } catch (o) {
      throw o instanceof p ? new p([...o.issues, ...s]) : o;
    }
    throw new p(s);
  }
  async _transform(t, a) {
    return super._transform(t, a);
  }
}
class G extends h {
  constructor(t) {
    super("lazy"), this.resolver = t;
  }
  schema;
  resolveSchema() {
    return this.schema || (this.schema = this.resolver()), this.schema;
  }
  async _prepare(t) {
    return this.resolveSchema()._prepare(t);
  }
  async _validate(t, a) {
    return this.resolveSchema()._validate(t, a);
  }
  async _transform(t, a) {
    return this.resolveSchema()._transform(t, a);
  }
}
function Q(e) {
  return new G(e);
}
function X() {
  const e = {};
  for (const t of T)
    if (t.dataType !== "switch") {
      if (t.dataType === "array") {
        e.array = (a, s = {}) => new K(a, s);
        continue;
      }
      if (t.dataType === "object") {
        e.object = (a = {}) => new b(a);
        continue;
      }
      if (t.dataType === "literal") {
        e.literal = (a, s = {}) => new h("literal", {
          ...s,
          validate: { ...s.validate, equals: a }
        });
        continue;
      }
      if (t.dataType === "record") {
        e.record = (a, s, r = {}) => new h("record", {
          ...r,
          validate: {
            ...r.validate,
            keysAndValues: [a, s]
          }
        });
        continue;
      }
      if (t.dataType === "map") {
        e.map = (a, s, r = {}) => new h("map", {
          ...r,
          validate: {
            ...r.validate,
            entries: [a, s]
          }
        });
        continue;
      }
      if (t.dataType === "set") {
        e.set = (a = {}) => {
          const s = a?.validate?.ofType ?? new h("any");
          return new W(s, a);
        };
        continue;
      }
      if (t.dataType === "instanceof") {
        e.instanceof = (a, s = {}) => new h("instanceof", {
          ...s,
          validate: { ...s.validate, constructor: a }
        });
        continue;
      }
      if (t.dataType === "union") {
        e.union = (a = {}) => new Y(a);
        continue;
      }
      e[t.dataType] = (a = {}) => new h(t.dataType, a);
    }
  return e.switch = (t) => new H(t), e.lazy = Q, e;
}
const ee = X();
export {
  h as Schema,
  H as SwitchSchema,
  p as ValidationError,
  x as definePlugin,
  ee as s
};
