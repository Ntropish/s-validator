'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

function definePlugin(plugin) {
  return plugin;
}
class ValidationError extends Error {
  issues;
  constructor(issues) {
    super(issues[0]?.message || "Validation failed");
    this.issues = issues;
    this.name = "ValidationError";
  }
}

const anyPlugin = definePlugin({
  dataType: "any",
  validate: {
    identity: {
      validator: (value) => true,
      message: (ctx) => "Invalid value."
      // This should ideally never be reached
    }
  }
});

const arrayPlugin = definePlugin({
  dataType: "array",
  validate: {
    identity: {
      validator: (value) => Array.isArray(value),
      message: (ctx) => `Invalid type. Expected array, received ${typeof ctx.value}.`
    },
    length: {
      validator: (value, [length]) => value.length === length,
      message: (ctx) => `${ctx.label} must contain exactly ${ctx.args[0]} items.`
    },
    minLength: {
      validator: (value, [minLength]) => value.length >= minLength,
      message: (ctx) => `${ctx.label} must contain at least ${ctx.args[0]} items.`
    },
    maxLength: {
      validator: (value, [maxLength]) => value.length <= maxLength,
      message: (ctx) => `${ctx.label} must contain at most ${ctx.args[0]} items.`
    },
    nonEmpty: {
      validator: (value) => value.length > 0,
      message: (ctx) => `${ctx.label} must not be empty.`
    },
    contains: {
      validator: (value, [element]) => value.includes(element),
      message: (ctx) => `${ctx.label} must contain the element ${ctx.args[0]}.`
    },
    excludes: {
      validator: (value, [element]) => !value.includes(element),
      message: (ctx) => `${ctx.label} must not contain the element ${ctx.args[0]}.`
    },
    unique: {
      validator: (value) => new Set(value).size === value.length,
      message: (ctx) => `${ctx.label} must contain unique items.`
    },
    ofType: {
      async validator(value, [schema], context) {
        for (let i = 0; i < value.length; i++) {
          const result = await schema.safeParse(value[i], context.ctx);
          if (result.status === "error") {
            const issues = result.error.issues.map((issue) => ({
              ...issue,
              path: [...context.path, i, ...issue.path]
            }));
            throw new ValidationError(issues);
          }
        }
        return true;
      },
      message: () => `Invalid item in array.`
    },
    items: {
      async validator(value, schemas, context) {
        if (value.length !== schemas.length) {
          throw new ValidationError([
            {
              message: `Expected ${schemas.length} items, but received ${value.length}.`,
              path: context.path
            }
          ]);
        }
        for (let i = 0; i < schemas.length; i++) {
          const result = await schemas[i].safeParse(value[i], context.ctx);
          if (result.status === "error") {
            const issues = result.error.issues.map((issue) => ({
              ...issue,
              path: [...context.path, i, ...issue.path]
            }));
            throw new ValidationError(issues);
          }
        }
        return true;
      },
      message: () => `Invalid tuple item.`
    }
  }
});

const bigintPlugin = definePlugin({
  dataType: "bigint",
  prepare: {
    coerce: (value, [enabled]) => {
      if (enabled === false) {
        return value;
      }
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        try {
          return BigInt(value);
        } catch {
          return value;
        }
      }
      return value;
    }
  },
  validate: {
    identity: {
      validator: (value) => typeof value === "bigint",
      message: (ctx) => `Invalid type. Expected bigint, received ${typeof ctx.value}.`
    }
  }
});

const truthyStrings = /* @__PURE__ */ new Set(["true", "1", "yes", "on", "y", "enabled"]);
const falsyStrings = /* @__PURE__ */ new Set(["false", "0", "no", "off", "n", "disabled"]);
const booleanPlugin = definePlugin({
  dataType: "boolean",
  prepare: {
    coerce: (value, [enabled]) => {
      if (enabled === false) {
        return value;
      }
      return !!value;
    },
    stringBool: (value, [enabled]) => {
      if (enabled === false) {
        return value;
      }
      if (typeof value === "string") {
        const lowerValue = value.toLowerCase();
        if (truthyStrings.has(lowerValue)) {
          return true;
        }
        if (falsyStrings.has(lowerValue)) {
          return false;
        }
      }
      return value;
    }
  },
  validate: {
    identity: {
      validator: (value) => typeof value === "boolean",
      message: (ctx) => `Invalid type. Expected boolean, received ${typeof ctx.value}.`
    },
    required: {
      validator: (value) => typeof value === "boolean",
      message: (ctx) => `${ctx.label} is required.`
    }
  }
});

const datePlugin = definePlugin({
  dataType: "date",
  prepare: {
    coerce: (value, [enabled]) => {
      if (enabled === false) {
        return value;
      }
      if (value instanceof Date) {
        return value;
      }
      if (typeof value === "string" || typeof value === "number") {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      return value;
    }
  },
  validate: {
    identity: {
      validator: (value) => value instanceof Date,
      message: (ctx) => `Invalid type. Expected Date, received ${typeof ctx.value}.`
    },
    min: {
      validator: (value, [minDate]) => value.getTime() >= minDate.getTime(),
      message: (ctx) => `${ctx.label} must be on or after ${new Date(
        ctx.args[0]
      ).toDateString()}.`
    },
    max: {
      validator: (value, [maxDate]) => value.getTime() <= maxDate.getTime(),
      message: (ctx) => `${ctx.label} must be on or before ${new Date(
        ctx.args[0]
      ).toDateString()}.`
    }
  }
});

const instanceofPlugin = definePlugin({
  dataType: "instanceof",
  validate: {
    identity: {
      validator: (value) => {
        return typeof value === "object" && value !== null;
      },
      message: (ctx) => `Invalid type. Expected object, received ${typeof ctx.value}.`
    },
    constructor: {
      validator: (value, [constructor]) => {
        return value instanceof constructor;
      },
      message: (ctx) => {
        const constructorName = ctx.args[0]?.name || "Unknown";
        return `Value must be an instance of ${constructorName}.`;
      }
    }
  }
});

const mapPlugin = definePlugin({
  dataType: "map",
  validate: {
    identity: {
      validator: (value) => {
        return value instanceof Map;
      },
      message: (ctx) => `Invalid type. Expected Map, received ${typeof ctx.value}.`
    },
    entries: {
      validator: async (value, [keySchema, valueSchema], context) => {
        const issues = [];
        for (const [key, val] of value.entries()) {
          const keyResult = await keySchema.safeParse(key, context);
          if (keyResult.status === "error") {
            issues.push(...keyResult.error.issues);
          }
          const valueResult = await valueSchema.safeParse(val, context);
          if (valueResult.status === "error") {
            issues.push(...valueResult.error.issues);
          }
        }
        if (issues.length > 0) {
          throw new ValidationError(issues);
        }
        return true;
      },
      message: (ctx) => `Map validation failed.`
    }
  }
});

const nanPlugin = definePlugin({
  dataType: "nan",
  validate: {
    identity: {
      validator: (value) => Number.isNaN(value),
      message: (ctx) => `Value must be NaN.`
    }
  }
});

const neverPlugin = definePlugin({
  dataType: "never",
  validate: {
    identity: {
      validator: (value) => false,
      message: (ctx) => `Value must be of type never.`
    }
  }
});

const numberPlugin = definePlugin({
  dataType: "number",
  prepare: {
    coerce: (value, [enabled]) => {
      if (enabled === false) {
        return value;
      }
      if (typeof value === "number") {
        return value;
      }
      if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) {
        return parseFloat(value);
      }
      return value;
    }
  },
  validate: {
    identity: {
      validator: (value) => typeof value === "number",
      message: (ctx) => `Invalid type. Expected number, received ${typeof ctx.value}.`
    },
    min: {
      validator: (value, [min]) => value >= min,
      message: (ctx) => `${ctx.label} must be at least ${ctx.args[0]}.`
    },
    max: {
      validator: (value, [max]) => value <= max,
      message: (ctx) => `${ctx.label} must be at most ${ctx.args[0]}.`
    },
    gt: {
      validator: (value, [num]) => value > num,
      message: (ctx) => `${ctx.label} must be greater than ${ctx.args[0]}.`
    },
    gte: {
      validator: (value, [num]) => value >= num,
      message: (ctx) => `${ctx.label} must be greater than or equal to ${ctx.args[0]}.`
    },
    lt: {
      validator: (value, [num]) => value < num,
      message: (ctx) => `${ctx.label} must be less than ${ctx.args[0]}.`
    },
    lte: {
      validator: (value, [num]) => value <= num,
      message: (ctx) => `${ctx.label} must be less than or equal to ${ctx.args[0]}.`
    },
    range: {
      validator: (value, [[min, max]]) => value >= min && value <= max,
      message: (ctx) => `${ctx.label} must be between ${ctx.args[0][0]} and ${ctx.args[0][1]}.`
    },
    exclusiveRange: {
      validator: (value, [[min, max]]) => value > min && value < max,
      message: (ctx) => `${ctx.label} must be strictly between ${ctx.args[0][0]} and ${ctx.args[0][1]}.`
    },
    multipleOf: {
      validator: (value, [multipleOf]) => value % multipleOf === 0,
      message: (ctx) => `${ctx.label} must be a multiple of ${ctx.args[0]}.`
    },
    integer: {
      validator: (value, [enabled]) => {
        if (enabled === void 0 || enabled === false) return true;
        return Number.isInteger(value);
      },
      message: (ctx) => `${ctx.label} must be an integer.`
    },
    safe: {
      validator: (value, [enabled]) => {
        if (enabled === void 0 || enabled === false) return true;
        return Number.isSafeInteger(value);
      },
      message: (ctx) => `${ctx.label} must be a safe integer.`
    },
    positive: {
      validator: (value) => value > 0,
      message: (ctx) => `${ctx.label} must be positive.`
    },
    negative: {
      validator: (value) => value < 0,
      message: (ctx) => `${ctx.label} must be negative.`
    }
  }
});

const objectPlugin = definePlugin({
  dataType: "object",
  validate: {
    identity: {
      validator: (value) => {
        return typeof value === "object" && value !== null && !Array.isArray(value);
      },
      message: (ctx) => `Invalid type. Expected object, received ${typeof ctx.value}.`
    }
  }
});

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
const regex$1 = {
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
  emoji: /^(\p{Extended_Pictographic}|\p{Emoji_Component})+$/u,
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
};

const regex = {
  ...regex$1,
  cuid2: /^[a-z][a-z0-9]{7,31}$/,
  /**
   * ULID v7, with millisecond precision.
   *
   * @see https://github.com/ulid/spec
   * @see https://github.com/fpotter/ulid-v7
   */
  uuidV7: /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

const stringPlugin = definePlugin({
  dataType: "string",
  prepare: {
    coerce: (value, [enabled]) => {
      if (enabled === false) {
        return value;
      }
      if (typeof value === "string") {
        return value;
      }
      if (value === null || value === void 0 || typeof value === "object" && !value.toString) {
        return value;
      }
      return String(value);
    },
    trim: (value, [enabled]) => {
      if (enabled === false) {
        return value;
      }
      return typeof value === "string" ? value.trim() : value;
    },
    toLowerCase: (value, [enabled]) => {
      if (enabled === false) {
        return value;
      }
      return typeof value === "string" ? value.toLowerCase() : value;
    }
  },
  transform: {
    toUpperCase: (value) => value.toUpperCase(),
    toLowerCase: (value) => value.toLowerCase(),
    trim: (value) => value.trim()
  },
  validate: {
    identity: {
      validator: (value) => typeof value === "string",
      message: (ctx) => `Invalid type. Expected ${ctx.dataType}, received ${typeof ctx.value}.`
    },
    length: {
      validator: (value, [length]) => value.length === length,
      message: (ctx) => `${ctx.label} must be exactly ${ctx.args[0]} characters long.`
    },
    minLength: {
      validator: (value, [minLength]) => value.length >= minLength,
      message: (ctx) => `${ctx.label} must be at least ${ctx.args[0]} characters long.`
    },
    maxLength: {
      validator: (value, [maxLength]) => value.length <= maxLength,
      message: (ctx) => `${ctx.label} must be at most ${ctx.args[0]} characters long.`
    },
    range: {
      validator: (value, [min, max]) => value.length >= min && value.length <= max,
      message: (ctx) => `${ctx.label} must be between ${ctx.args[0]} and ${ctx.args[1]} characters long.`
    },
    exclusiveRange: {
      validator: (value, [min, max]) => value.length > min && value.length < max,
      message: (ctx) => `${ctx.label} must be strictly between ${ctx.args[0]} and ${ctx.args[1]} characters long.`
    },
    pattern: {
      validator: (value, [pattern]) => pattern.test(value),
      message: (ctx) => `${ctx.label} does not match the required pattern.`
    },
    oneOf: {
      validator: (value, options) => options.includes(value),
      message: (ctx) => `${ctx.label} must be one of the following values: ${ctx.args.join(
        ", "
      )}`
    },
    cuid: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.cuid.test(value) : !regex.cuid.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid CUID.`
    },
    cuid2: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.cuid2.test(value) : !regex.cuid2.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid CUID2.`
    },
    ulid: {
      validator: (value, [enabled = true]) => {
        return enabled ? regex.ulid.test(value) : !regex.ulid.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid ULID.`
    },
    emoji: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.emoji.test(value) : !regex.emoji.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid emoji.`
    },
    ipv4: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.ipv4.test(value) : !regex.ipv4.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid IPv4 address.`
    },
    ipv4Cidr: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.cidrv4.test(value) : !regex.cidrv4.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid IPv4 CIDR.`
    },
    ipv6: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.ipv6.test(value) : !regex.ipv6.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid IPv6 address.`
    },
    ipv6Cidr: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.cidrv6.test(value) : !regex.cidrv6.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid IPv6 CIDR.`
    },
    base64: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.base64.test(value) : !regex.base64.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid base64 string.`
    },
    base64Url: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.base64url.test(value) : !regex.base64url.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid base64url string.`
    },
    date: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.isoDate.test(value) : !regex.isoDate.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid date string.`
    },
    time: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.isoTime.test(value) : !regex.isoTime.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid time string.`
    },
    duration: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.isoDuration.test(value) : !regex.isoDuration.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid duration string.`
    },
    hexColor: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.hexColor.test(value) : !regex.hexColor.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid hex color.`
    },
    semver: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.semver.test(value) : !regex.semver.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid semver string.`
    },
    url: {
      validator: (value, [enabled = true]) => {
        return enabled ? regex.url.test(value) : !regex.url.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid URL.`
    },
    uuid: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.uuid.test(value) : !regex.uuid.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid UUID.`
    },
    uuidV7: {
      validator: (value, [enabled = true]) => {
        return enabled ? regex.uuidV7.test(value) : !regex.uuidV7.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid UUIDv7.`
    },
    datetime: {
      validator: (value, [enabled]) => {
        if (enabled === void 0) return true;
        return enabled ? regex.isoDateTime.test(value) : !regex.isoDateTime.test(value);
      },
      message: (ctx) => `${ctx.label} must be a valid datetime string.`
    },
    json: {
      validator: async (value, [schema]) => {
        let parsed;
        try {
          parsed = JSON.parse(value);
        } catch (e) {
          return false;
        }
        if (schema) {
          const result = await schema.safeParse(parsed);
          return result.status === "success";
        }
        return true;
      },
      message: (ctx) => {
        if (ctx.args[0]) {
          return `${ctx.label} must be a JSON string that conforms to the provided schema.`;
        }
        return `${ctx.label} must be a valid JSON string.`;
      }
    },
    email: {
      validator: (value, [config]) => {
        if (config === void 0 || config === false) {
          return true;
        }
        if (!regex.email.test(value)) {
          return false;
        }
        if (typeof config === "object") {
          const domain = value.substring(value.lastIndexOf("@") + 1);
          if (config.denied) {
            for (const rule of config.denied) {
              if (rule instanceof RegExp ? rule.test(domain) : rule === domain) {
                return false;
              }
            }
          }
          if (config.allowed) {
            for (const rule of config.allowed) {
              if (rule instanceof RegExp ? rule.test(domain) : rule === domain) {
                return true;
              }
            }
            return false;
          }
        }
        return true;
      },
      message: (ctx) => `${ctx.label} must be a valid email address.`
    }
  }
});

const unknownPlugin = definePlugin({
  dataType: "unknown",
  validate: {
    identity: {
      validator: (value) => true,
      message: (ctx) => "Invalid value."
    }
  }
});

const isLiteral = (value) => {
  const type = typeof value;
  return type === "string" || type === "number" || type === "boolean" || value === null;
};
const literalPlugin = definePlugin({
  dataType: "literal",
  validate: {
    identity: {
      validator: isLiteral,
      message: (ctx) => `Invalid type. Expected a literal value.`
    },
    equals: {
      validator: (value, [literal]) => {
        return value === literal;
      },
      message: (ctx) => `Invalid literal value. Expected ${JSON.stringify(
        ctx.args[0]
      )}, received ${JSON.stringify(ctx.value)}`
    }
  }
});

const unionPlugin = definePlugin({
  dataType: "union",
  validate: {
    identity: {
      validator: () => true,
      message: () => "is any"
    },
    variants: {
      validator: async (value, schemas, context) => {
        const issues = [];
        for (const schema of schemas) {
          try {
            await schema.parse(value, context);
            return true;
          } catch (e) {
            if (e instanceof ValidationError) {
              issues.push(...e.issues);
            } else {
              throw e;
            }
          }
        }
        throw new ValidationError(issues);
      },
      message: (ctx) => `No union variant matched the provided value.`
    }
  }
});

const recordPlugin = definePlugin({
  dataType: "record",
  validate: {
    identity: {
      validator: (value) => {
        return typeof value === "object" && value !== null && !Array.isArray(value);
      },
      message: (ctx) => `Invalid type. Expected a record object, received ${typeof ctx.value}.`
    },
    keysAndValues: {
      validator: async (value, [keySchema, valueSchema], context) => {
        const issues = [];
        for (const [key, val] of Object.entries(value)) {
          const keyResult = await keySchema.safeParse(key, context);
          if (keyResult.status === "error") {
            issues.push(...keyResult.error.issues);
          }
          const valueResult = await valueSchema.safeParse(val, context);
          if (valueResult.status === "error") {
            issues.push(...valueResult.error.issues);
          }
        }
        if (issues.length > 0) {
          throw new ValidationError(issues);
        }
        return true;
      },
      message: (ctx) => `Record validation failed.`
    }
  }
});

const setPlugin = definePlugin({
  dataType: "set",
  validate: {
    identity: {
      validator: (value) => value instanceof Set,
      message: (ctx) => `Invalid type. Expected set, received ${typeof ctx.value}.`
    }
  }
});

const plugins = [
  anyPlugin,
  arrayPlugin,
  bigintPlugin,
  booleanPlugin,
  datePlugin,
  instanceofPlugin,
  literalPlugin,
  mapPlugin,
  nanPlugin,
  neverPlugin,
  numberPlugin,
  objectPlugin,
  recordPlugin,
  stringPlugin,
  unionPlugin,
  unknownPlugin,
  setPlugin
];
const validatorMap = {};
const preparationMap = {};
const transformationMap = {};
const messageMap = {};
for (const plugin of plugins) {
  const dataType = plugin.dataType;
  validatorMap[dataType] = validatorMap[dataType] || {
    identity: (value) => false
  };
  preparationMap[dataType] = preparationMap[dataType] || {};
  transformationMap[dataType] = transformationMap[dataType] || {};
  messageMap[dataType] = messageMap[dataType] || {};
  if (plugin.prepare) {
    for (const name in plugin.prepare) {
      preparationMap[dataType][name] = plugin.prepare[name];
    }
  }
  if (plugin.validate) {
    for (const name in plugin.validate) {
      const validatorDef = plugin.validate[name];
      validatorMap[dataType][name] = validatorDef.validator;
      messageMap[dataType][name] = validatorDef.message;
    }
  }
  if (plugin.transform) {
    for (const name in plugin.transform) {
      transformationMap[dataType][name] = plugin.transform[name];
    }
  }
}

class Schema {
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
  constructor(dataType, config = {}) {
    this.dataType = dataType;
    this.config = config;
    const {
      prepare,
      validate,
      transform,
      // messages, optional, and nullable are read from this.config
      ...rest
    } = config;
    this.label = config.label || this.dataType.charAt(0).toUpperCase() + this.dataType.slice(1);
    const validatorCollection = validatorMap[dataType];
    const preparationCollection = preparationMap[dataType];
    const transformationCollection = transformationMap[dataType];
    if (validatorCollection?.identity) {
      this.validators.push({
        name: "identity",
        validator: validatorCollection.identity,
        args: []
      });
    }
    if (prepare) {
      for (const [prepName, prepConfig] of Object.entries(prepare)) {
        if (prepName === "custom") {
          this.customPreparations = prepConfig;
          continue;
        }
        if (preparationCollection?.[prepName]) {
          this.preparations.push({
            name: prepName,
            preparation: preparationCollection[prepName],
            args: [prepConfig]
          });
        }
      }
    }
    const validationRules = { ...validate || {}, ...rest };
    if (validationRules) {
      for (let [valName, valConfig] of Object.entries(validationRules)) {
        if (valName === "custom") {
          this.customValidators = this.customValidators.concat(
            Array.isArray(valConfig) ? valConfig : [valConfig]
          );
          continue;
        }
        if (valConfig === false) {
          continue;
        }
        if (valConfig === void 0) {
          valConfig = true;
        }
        if (validatorCollection?.[valName]) {
          this.validators.push({
            name: valName,
            validator: validatorCollection[valName],
            args: Array.isArray(valConfig) ? valConfig : [valConfig]
          });
        }
      }
    }
    if (transform) {
      for (const [transName, transConfig] of Object.entries(transform)) {
        if (transName === "custom") {
          this.customTransformations = transConfig;
          continue;
        }
        if (transformationCollection?.[transName]) {
          this.transformations.push({
            name: transName,
            transformation: transformationCollection[transName],
            args: [transConfig]
          });
        }
      }
    }
    this["~standard"] = {
      version: 1,
      vendor: "s-val",
      validate: async (value) => {
        const result = await this.safeParse(value);
        if (result.status === "success") {
          return { value: result.data };
        }
        const issues = result.error.issues.map(
          (issue) => ({
            message: issue.message,
            path: issue.path.map((key) => ({ key }))
          })
        );
        return { issues };
      },
      types: {}
    };
  }
  async _prepare(context) {
    let current_value = context.value;
    for (const { preparation, args } of this.preparations) {
      current_value = await preparation(
        current_value,
        args,
        { ...context, value: current_value },
        this
      );
    }
    for (const customPreparation of this.customPreparations) {
      current_value = await customPreparation(
        current_value,
        [],
        { ...context, value: current_value },
        this
      );
    }
    return current_value;
  }
  async _validate(value, context) {
    const issues = [];
    const messages = this.config.messages ?? {};
    const current_value = value;
    if (this.config.optional && current_value === void 0) return;
    if (this.config.nullable && current_value === null) return current_value;
    const identityValidator = this.validators.find(
      (v) => v.name === "identity"
    );
    if (identityValidator && !await identityValidator.validator(
      current_value,
      identityValidator.args,
      { ...context, value: current_value },
      this
    )) {
      const messageProducerContext = {
        label: this.label,
        value: current_value,
        path: context.path,
        dataType: this.dataType,
        ctx: context.ctx,
        args: [],
        schema: this
      };
      let message;
      const userMessage = messages["identity"];
      if (typeof userMessage === "string") {
        message = userMessage;
      } else if (typeof userMessage === "function") {
        message = userMessage(messageProducerContext);
      } else {
        const defaultMessageProducer = messageMap[this.dataType]?.["identity"];
        if (defaultMessageProducer) {
          message = defaultMessageProducer(messageProducerContext);
        }
      }
      issues.push({
        path: context.path,
        message: message ?? `Validation failed for ${this.dataType}.identity`
      });
      if (issues.length > 0) {
        throw new ValidationError(issues);
      }
    }
    for (const { name, validator, args } of this.validators) {
      if (name === "identity") continue;
      try {
        if (!await validator(
          current_value,
          args,
          { ...context, value: current_value },
          this
        )) {
          const messageProducerContext = {
            label: this.label,
            value: current_value,
            path: context.path,
            dataType: this.dataType,
            ctx: context.ctx,
            args,
            schema: this
          };
          let message;
          const userMessage = messages[name];
          if (typeof userMessage === "string") {
            message = userMessage;
          } else if (typeof userMessage === "function") {
            message = userMessage(messageProducerContext);
          } else {
            const defaultMessageProducer = messageMap[this.dataType]?.[name];
            if (defaultMessageProducer) {
              message = defaultMessageProducer(messageProducerContext);
            }
          }
          issues.push({
            path: context.path,
            message: message ?? `Validation failed for ${this.dataType}.${name}`
          });
        }
      } catch (e) {
        if (e instanceof ValidationError) {
          issues.push(...e.issues);
        } else {
          throw e;
        }
      }
    }
    for (const customValidator of this.customValidators) {
      const customValidatorFn = typeof customValidator === "object" ? customValidator.validator : customValidator;
      const customMessage = typeof customValidator === "object" ? customValidator.message : void 0;
      const customValidatorName = typeof customValidator === "object" ? customValidator.name : void 0;
      if (!await customValidatorFn(
        current_value,
        [],
        { ...context, value: current_value },
        this
      )) {
        const messageProducerContext = {
          label: this.label,
          value: current_value,
          path: context.path,
          dataType: this.dataType,
          ctx: context.ctx,
          args: [],
          schema: this
        };
        let message = typeof customMessage === "function" ? customMessage(messageProducerContext) : customMessage;
        if (!message) {
          const userMessage = messages[customValidatorName] ?? messages["custom"];
          if (typeof userMessage === "string") {
            message = userMessage;
          } else if (typeof userMessage === "function") {
            message = userMessage(messageProducerContext);
          } else {
            const defaultMessageProducer = messageMap[this.dataType]?.["custom"];
            if (defaultMessageProducer) {
              message = defaultMessageProducer(messageProducerContext);
            }
          }
        }
        issues.push({
          path: context.path,
          message: message ?? `Custom validation failed for ${customValidatorName ?? this.dataType}`
        });
      }
    }
    if (issues.length > 0) {
      throw new ValidationError(issues);
    }
    return current_value;
  }
  async _transform(value, context) {
    let current_value = value;
    for (const { transformation, args } of this.transformations) {
      current_value = await transformation(
        current_value,
        args,
        { ...context, value: current_value },
        this
      );
    }
    for (const customTransformation of this.customTransformations) {
      current_value = await customTransformation(
        current_value,
        [],
        { ...context, value: current_value },
        this
      );
    }
    return current_value;
  }
  async parse(data, ctx) {
    const result = await this.safeParse(data, ctx);
    if (result.status === "error") {
      throw result.error;
    }
    return result.data;
  }
  async safeParse(data, ctx) {
    const context = {
      rootData: data,
      path: [],
      value: data,
      ctx
    };
    try {
      const preparedValue = await this._prepare(context);
      const validatedValue = await this._validate(preparedValue, {
        ...context,
        value: preparedValue
      });
      const transformedValue = await this._transform(validatedValue, {
        ...context,
        value: validatedValue
      });
      return { status: "success", data: transformedValue };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { status: "error", error };
      }
      return {
        status: "error",
        error: new ValidationError([
          {
            message: `Unhandled error in schema: ${error.message}`,
            path: context.path
          }
        ])
      };
    }
  }
  optional() {
    return new Schema(this.dataType, { ...this.config, optional: true });
  }
  nullable() {
    return new Schema(this.dataType, { ...this.config, nullable: true });
  }
  asKey() {
    return this;
  }
}

class SwitchSchema extends Schema {
  constructor(config) {
    super("switch", config);
  }
  selectCase(context) {
    const {
      select,
      cases,
      default: defaultSchema
    } = this.config;
    if (!select || !cases) {
      return void 0;
    }
    const key = select(context);
    return cases[key] || defaultSchema;
  }
  async _prepare(context) {
    const preparedValue = await super._prepare(context);
    const caseSchema = this.selectCase({ ...context, value: preparedValue });
    if (caseSchema) {
      return await caseSchema._prepare({ ...context, value: preparedValue });
    }
    return preparedValue;
  }
  async _validate(value, context) {
    const validatedValue = await super._validate(value, context);
    const caseSchema = this.selectCase({ ...context, value: validatedValue });
    if (caseSchema) {
      return await caseSchema._validate(validatedValue, context);
    }
    const { failOnNoMatch } = this.config;
    if (failOnNoMatch) {
      const key = this.config.select(context);
      throw new ValidationError([
        {
          path: context.path,
          message: `No case matched for key "${key}" and no default was provided.`
        }
      ]);
    }
    return value;
  }
  async _transform(value, context) {
    const transformedValue = await super._transform(value, context);
    const caseSchema = this.selectCase({ ...context, value: transformedValue });
    if (caseSchema) {
      return await caseSchema._transform(transformedValue, context);
    }
    return transformedValue;
  }
}

class ArraySchema extends Schema {
  itemSchema;
  constructor(itemSchema, config) {
    const newConfig = { ...config };
    if (newConfig.validate?.ofType) {
      delete newConfig.validate.ofType;
    }
    super("array", newConfig);
    this.itemSchema = itemSchema;
  }
  async _prepare(context) {
    const preparedValue = await super._prepare(context);
    if (!Array.isArray(preparedValue)) {
      return preparedValue;
    }
    const preparedArray = [];
    for (let i = 0; i < preparedValue.length; i++) {
      const item = preparedValue[i];
      const preparedItem = await this.itemSchema._prepare({
        rootData: context.rootData,
        path: [...context.path, i],
        value: item,
        ctx: context.ctx
      });
      preparedArray.push(preparedItem);
    }
    return preparedArray;
  }
  async _validate(value, context) {
    if (this.config.optional && value === void 0) {
      return [];
    }
    if (this.config.nullable && value === null) {
      return null;
    }
    await super._validate(value, context);
    const issues = [];
    const newArray = [];
    const itemPromises = value.map(async (item, i) => {
      const newContext = {
        rootData: context.rootData,
        path: [...context.path, i],
        value: item,
        ctx: context.ctx
      };
      try {
        const validatedItem = await this.itemSchema._validate(item, newContext);
        newArray[i] = validatedItem;
      } catch (error) {
        if (error instanceof ValidationError) {
          issues.push(...error.issues);
        } else {
          throw error;
        }
      }
    });
    await Promise.all(itemPromises);
    if (issues.length > 0) {
      throw new ValidationError(issues);
    }
    return newArray;
  }
  async _transform(value, context) {
    const transformedValue = await super._transform(value, context);
    if (!Array.isArray(transformedValue)) {
      return transformedValue;
    }
    const newArray = [];
    const itemPromises = transformedValue.map(async (item, i) => {
      newArray[i] = await this.itemSchema._transform(item, {
        rootData: context.rootData,
        path: [...context.path, i],
        value: item,
        ctx: context.ctx
      });
    });
    await Promise.all(itemPromises);
    return newArray;
  }
}

class ObjectSchema extends Schema {
  constructor(config) {
    super("object", config);
  }
  async _prepare(context) {
    const preparedValue = await super._prepare(context);
    if (preparedValue === null || preparedValue === void 0 || typeof preparedValue !== "object") {
      return preparedValue;
    }
    const shape = this.getProperties();
    const newValue = { ...preparedValue };
    for (const key in shape) {
      if (Object.prototype.hasOwnProperty.call(newValue, key)) {
        const propertySchema = shape[key];
        newValue[key] = await propertySchema._prepare({
          rootData: context.rootData,
          path: [...context.path, key],
          value: newValue[key],
          ctx: context.ctx
        });
      }
    }
    return newValue;
  }
  async _validate(value, context) {
    if (this.config.optional && value === void 0) {
      return void 0;
    }
    if (this.config.nullable && value === null) {
      return null;
    }
    await super._validate(value, context);
    const shape = this.getProperties();
    const strict = this.config.strict;
    const issues = [];
    const newValue = {};
    const propertyPromises = Object.keys(shape).map(async (key) => {
      const propertySchema = shape[key];
      const propertyValue = value[key];
      const newContext = {
        rootData: context.rootData,
        path: [...context.path, key],
        value: propertyValue,
        ctx: context.ctx
      };
      try {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const validatedValue = await propertySchema._validate(
            propertyValue,
            newContext
          );
          newValue[key] = validatedValue;
        } else if (!propertySchema.config.optional) {
          issues.push({
            path: newContext.path,
            message: `Required property '${key}' is missing`
          });
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          issues.push(...error.issues);
        } else {
          throw error;
        }
      }
    });
    await Promise.all(propertyPromises);
    if (strict) {
      for (const key in value) {
        if (!shape[key]) {
          issues.push({
            path: [...context.path, key],
            message: `Unrecognized key: '${key}'`
          });
        }
      }
    } else {
      for (const key in value) {
        if (!shape[key]) {
          newValue[key] = value[key];
        }
      }
    }
    if (issues.length > 0) {
      throw new ValidationError(issues);
    }
    for (const customValidator of this.customValidators) {
      const customValidatorFn = typeof customValidator === "object" ? customValidator.validator : customValidator;
      const customMessage = typeof customValidator === "object" ? customValidator.message : void 0;
      const customValidatorName = typeof customValidator === "object" ? customValidator.name : void 0;
      if (!await customValidatorFn(
        newValue,
        [],
        {
          ...context,
          value: newValue
        },
        this
      )) {
        const messages = this.config.messages ?? {};
        const messageProducerContext = {
          label: this.label,
          value: newValue,
          path: context.path,
          dataType: this.dataType,
          ctx: context.ctx,
          args: [],
          schema: this
        };
        let message = typeof customMessage === "function" ? customMessage(messageProducerContext) : customMessage;
        if (!message) {
          const userMessage = messages[customValidatorName] ?? messages["custom"];
          if (typeof userMessage === "string") {
            message = userMessage;
          } else if (typeof userMessage === "function") {
            message = userMessage(messageProducerContext);
          }
        }
        issues.push({
          path: context.path,
          message: message ?? `Custom validation failed for ${customValidatorName ?? this.dataType}`
        });
      }
    }
    if (issues.length > 0) {
      throw new ValidationError(issues);
    }
    return newValue;
  }
  async _transform(value, context) {
    const transformedValue = await super._transform(value, context);
    const shape = this.getProperties();
    const newValue = { ...transformedValue };
    const transformPromises = Object.keys(shape).map(async (key) => {
      if (Object.prototype.hasOwnProperty.call(newValue, key)) {
        const propertySchema = shape[key];
        newValue[key] = await propertySchema._transform(newValue[key], {
          rootData: context.rootData,
          path: [...context.path, key],
          value: newValue[key],
          ctx: context.ctx
        });
      }
    });
    await Promise.all(transformPromises);
    return newValue;
  }
  getProperties() {
    const config = this.config;
    return config.validate?.properties ?? {};
  }
  partial() {
    const originalProperties = this.getProperties();
    const newProperties = {};
    for (const key in originalProperties) {
      newProperties[key] = originalProperties[key].optional();
    }
    const newConfig = {
      ...this.config,
      validate: {
        ...this.config.validate,
        properties: newProperties
      }
    };
    return new ObjectSchema(newConfig);
  }
  pick(keys) {
    const originalProperties = this.getProperties();
    const newProperties = {};
    for (const key of keys) {
      if (originalProperties[key]) {
        newProperties[key] = originalProperties[key];
      }
    }
    const newConfig = {
      ...this.config,
      validate: {
        ...this.config.validate,
        properties: newProperties
      },
      strict: true
    };
    return new ObjectSchema(newConfig);
  }
  omit(keys) {
    const originalProperties = this.getProperties();
    const newProperties = { ...originalProperties };
    for (const key of keys) {
      delete newProperties[key];
    }
    const newConfig = {
      ...this.config,
      validate: {
        ...this.config.validate,
        properties: newProperties
      },
      strict: true
    };
    return new ObjectSchema(newConfig);
  }
  extend(extension) {
    const originalProperties = this.getProperties();
    const newProperties = { ...originalProperties, ...extension };
    const newConfig = {
      ...this.config,
      validate: {
        ...this.config.validate,
        properties: newProperties
      }
    };
    return new ObjectSchema(newConfig);
  }
}

class SetSchema extends Schema {
  valueSchema;
  constructor(itemSchema, config = {}) {
    super("set", config);
    this.valueSchema = itemSchema;
  }
  async _prepare(context) {
    const preparedValue = await super._prepare(context);
    if (!(preparedValue instanceof Set)) {
      return preparedValue;
    }
    const preparedSet = /* @__PURE__ */ new Set();
    const preparationPromises = Array.from(preparedValue).map(
      async (item, i) => {
        const preparedItem = await this.valueSchema._prepare({
          rootData: context.rootData,
          path: [...context.path, i],
          value: item,
          ctx: context.ctx
        });
        preparedSet.add(preparedItem);
      }
    );
    await Promise.all(preparationPromises);
    return preparedSet;
  }
  async _validate(value, context) {
    await super._validate(value, context);
    if (this.config.optional && value === void 0) {
      return void 0;
    }
    if (this.config.nullable && value === null) {
      return null;
    }
    if (!(value instanceof Set)) {
      return;
    }
    const issues = [];
    const validatedSet = /* @__PURE__ */ new Set();
    const validationPromises = Array.from(value).map(async (item, i) => {
      const newContext = {
        rootData: context.rootData,
        path: [...context.path, i],
        value: item,
        ctx: context.ctx
      };
      try {
        const validatedItem = await this.valueSchema._validate(
          item,
          newContext
        );
        validatedSet.add(validatedItem);
      } catch (error) {
        if (error instanceof ValidationError) {
          issues.push(...error.issues);
        } else {
          throw error;
        }
      }
    });
    await Promise.all(validationPromises);
    if (issues.length > 0) {
      throw new ValidationError(issues);
    }
    return validatedSet;
  }
  async _transform(value, context) {
    const transformedValue = await super._transform(
      value,
      context
    );
    if (!(transformedValue instanceof Set)) {
      return transformedValue;
    }
    const newSet = /* @__PURE__ */ new Set();
    const transformPromises = Array.from(transformedValue).map(
      async (item, i) => {
        const transformedItem = await this.valueSchema._transform(item, {
          rootData: context.rootData,
          path: [...context.path, i],
          value: item,
          ctx: context.ctx
        });
        newSet.add(transformedItem);
      }
    );
    await Promise.all(transformPromises);
    return newSet;
  }
}

class UnionSchema extends Schema {
  variants;
  constructor(config) {
    super("union", config);
    if (!config.validate?.of) {
      throw new Error(
        "Union schema must have variants provided in `validate.of`"
      );
    }
    this.variants = config.validate.of;
  }
  async _validate(value, context) {
    const issues = [];
    let successfulResult = void 0;
    let matched = false;
    for (const variant of this.variants) {
      try {
        const result = await variant.safeParse(value, context.ctx);
        if (result.status === "success") {
          successfulResult = result.data;
          matched = true;
          break;
        } else {
          issues.push(...result.error.issues);
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          issues.push(...error.issues);
        } else {
          throw error;
        }
      }
    }
    if (matched) {
      return successfulResult;
    }
    try {
      await super._validate(value, context);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError([...error.issues, ...issues]);
      }
      throw error;
    }
    throw new ValidationError(issues);
  }
  async _transform(value, context) {
    return super._transform(value, context);
  }
}

class LazySchema extends Schema {
  constructor(resolver) {
    super("lazy");
    this.resolver = resolver;
  }
  schema;
  resolveSchema() {
    if (!this.schema) {
      this.schema = this.resolver();
    }
    return this.schema;
  }
  async _prepare(context) {
    return this.resolveSchema()._prepare(context);
  }
  async _validate(value, context) {
    return this.resolveSchema()._validate(value, context);
  }
  async _transform(value, context) {
    return this.resolveSchema()._transform(value, context);
  }
}
function lazy(resolver) {
  return new LazySchema(resolver);
}

function createSchemaBuilder() {
  const builder = {};
  for (const plugin of plugins) {
    if (plugin.dataType === "switch") continue;
    if (plugin.dataType === "array") {
      builder.array = (itemSchema, config = {}) => {
        return new ArraySchema(itemSchema, config);
      };
      continue;
    }
    if (plugin.dataType === "object") {
      builder.object = (config = {}) => new ObjectSchema(config);
      continue;
    }
    if (plugin.dataType === "literal") {
      builder.literal = (value, config = {}) => {
        return new Schema("literal", {
          ...config,
          validate: { ...config.validate, equals: value }
        });
      };
      continue;
    }
    if (plugin.dataType === "record") {
      builder.record = (keySchema, valueSchema, config = {}) => {
        return new Schema("record", {
          ...config,
          validate: {
            ...config.validate,
            keysAndValues: [keySchema, valueSchema]
          }
        });
      };
      continue;
    }
    if (plugin.dataType === "map") {
      builder.map = (keySchema, valueSchema, config = {}) => {
        return new Schema("map", {
          ...config,
          validate: {
            ...config.validate,
            entries: [keySchema, valueSchema]
          }
        });
      };
      continue;
    }
    if (plugin.dataType === "set") {
      builder.set = (config = {}) => {
        const itemSchema = config?.validate?.ofType ?? new Schema("any");
        return new SetSchema(itemSchema, config);
      };
      continue;
    }
    if (plugin.dataType === "instanceof") {
      builder.instanceof = (constructor, config = {}) => {
        return new Schema("instanceof", {
          ...config,
          validate: { ...config.validate, constructor }
        });
      };
      continue;
    }
    if (plugin.dataType === "union") {
      builder.union = (config = {}) => {
        return new UnionSchema(config);
      };
      continue;
    }
    builder[plugin.dataType] = (config = {}) => {
      return new Schema(plugin.dataType, config);
    };
  }
  builder.switch = (config) => {
    return new SwitchSchema(config);
  };
  builder.lazy = lazy;
  return builder;
}
const s = createSchemaBuilder();

exports.Schema = Schema;
exports.SwitchSchema = SwitchSchema;
exports.s = s;
