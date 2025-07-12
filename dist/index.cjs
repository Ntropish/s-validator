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
    items: {
      validator: () => true,
      // Placeholder
      message: (ctx) => `Invalid item in ${ctx.label}.`
      // Placeholder
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
      validator: (value, [constructor]) => {
        if (!constructor) return false;
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
      validator: async (value, [keySchema, valueSchema], context) => {
        if (!(value instanceof Map)) return false;
        if (!keySchema || !valueSchema) return false;
        const issues = [];
        for (const [key, val] of value.entries()) {
          try {
            await keySchema.parse(key, context);
            await valueSchema.parse(val, context);
          } catch (e) {
            if (e instanceof ValidationError) {
              issues.push(e);
            } else {
              throw e;
            }
          }
        }
        if (issues.length > 0) {
          throw new ValidationError(issues.flatMap((e) => e.issues));
        }
        return true;
      },
      message: (ctx) => `Invalid type. Expected Map, received ${typeof ctx.value}.`
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
    },
    properties: {
      validator: async (value, [shape], context, schema) => {
        const issues = [];
        const { strict } = schema.config;
        const allKeys = /* @__PURE__ */ new Set([...Object.keys(value), ...Object.keys(shape)]);
        for (const key of allKeys) {
          const propertySchema = shape[key];
          const propertyValue = value[key];
          const propertyContext = {
            ...context,
            path: [...context.path, key]
          };
          if (propertySchema) {
            try {
              await propertySchema._validate(propertyValue, propertyContext);
            } catch (e) {
              if (e instanceof ValidationError) {
                issues.push(...e.issues);
              } else {
                throw e;
              }
            }
          } else if (strict && Object.prototype.hasOwnProperty.call(value, key)) {
            issues.push({
              path: propertyContext.path,
              message: `Unrecognized key: '${key}'`
            });
          }
        }
        if (issues.length > 0) {
          throw new ValidationError(issues);
        }
        return true;
      },
      message: () => `Object properties are invalid.`
    }
  },
  transform: {
    properties: async (value, [shape], context) => {
      const transformedObject = { ...value };
      for (const key in shape) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const propertySchema = shape[key];
          const propertyValue = value[key];
          const propertyContext = { ...context, path: [...context.path, key] };
          transformedObject[key] = await propertySchema._transform(
            propertyValue,
            propertyContext
          );
        }
      }
      const finalObject = {};
      for (const key of Object.keys(shape)) {
        if (Object.prototype.hasOwnProperty.call(transformedObject, key)) {
          finalObject[key] = transformedObject[key];
        }
      }
      return finalObject;
    }
  }
});

const setPlugin = definePlugin({
  dataType: "set",
  validate: {
    identity: {
      validator: async (value, [valueSchema], context) => {
        if (!(value instanceof Set)) return false;
        if (!valueSchema) return false;
        const issues = [];
        for (const val of value.values()) {
          try {
            await valueSchema.parse(val, context);
          } catch (e) {
            if (e instanceof ValidationError) {
              issues.push(e);
            } else {
              throw e;
            }
          }
        }
        if (issues.length > 0) {
          throw new ValidationError(issues.flatMap((e) => e.issues));
        }
        return true;
      },
      message: (ctx) => `Invalid type. Expected Set, received ${typeof ctx.value}.`
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
      validator: (value, [[min, max]]) => value.length >= min && value.length <= max,
      message: (ctx) => `${ctx.label} must be between ${ctx.args[0][0]} and ${ctx.args[0][1]} characters long.`
    },
    exclusiveRange: {
      validator: (value, [[min, max]]) => value.length > min && value.length < max,
      message: (ctx) => `${ctx.label} must be strictly between ${ctx.args[0][0]} and ${ctx.args[0][1]} characters long.`
    },
    pattern: {
      validator: (value, [pattern]) => pattern.test(value),
      message: (ctx) => `${ctx.label} does not match the required pattern.`
    },
    oneOf: {
      validator: (value, [options]) => options.includes(value),
      message: (ctx) => `${ctx.label} must be one of the following values: ${ctx.args[0].join(
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
        if (config === void 0) {
          return true;
        }
        if (typeof config === "object") {
          if (!regex.email.test(value)) {
            return false;
          }
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
          return true;
        }
        return config ? regex.email.test(value) : !regex.email.test(value);
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

const literalPlugin = definePlugin({
  dataType: "literal",
  validate: {
    identity: {
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
      validator: async (value, [schemas], context) => {
        if (!schemas) return false;
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
      validator: async (value, [keySchema, valueSchema], context) => {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
          return false;
        }
        if (!keySchema || !valueSchema) return false;
        const issues = [];
        for (const [key, val] of Object.entries(value)) {
          try {
            await keySchema.parse(key, context);
            await valueSchema.parse(val, context);
          } catch (e) {
            if (e instanceof ValidationError) {
              issues.push(e);
            } else {
              throw e;
            }
          }
        }
        if (issues.length > 0) {
          throw new ValidationError(issues.flatMap((e) => e.issues));
        }
        return true;
      },
      message: (ctx) => `Invalid type. Expected a record object, received ${typeof ctx.value}.`
    }
  }
});

const switchPlugin = definePlugin({
  dataType: "switch",
  validate: {
    identity: {
      validator: async (value, args, context, schema) => {
        const {
          select,
          cases,
          default: defaultSchema
        } = schema.config;
        if (!select || !cases) {
          return true;
        }
        const key = select(context);
        const caseSchema = cases[key] || defaultSchema;
        if (caseSchema) {
          const result = await caseSchema.safeParse(value, context);
          if (result.status === "error") {
            throw result.error;
          }
        }
        return true;
      },
      message: (ctx) => `Switch validation failed.`
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
  setPlugin,
  stringPlugin,
  switchPlugin,
  unionPlugin,
  unknownPlugin
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
            args: [valConfig]
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
    if (this.config.nullable && current_value === null) return;
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
      const result = typeof customValidator === "function" ? await customValidator(current_value, {
        ...context,
        value: current_value
      }) : await customValidator.validator(current_value, {
        ...context,
        value: current_value
      });
      if (!result) {
        let message;
        if (typeof customValidator === "object" && customValidator.message) {
          if (typeof customValidator.message === "string") {
            message = customValidator.message;
          } else {
            message = customValidator.message({
              label: this.label,
              value: current_value,
              path: context.path,
              dataType: this.dataType,
              ctx: context.ctx,
              args: [],
              // Custom validators don't have 'args' in the same way
              schema: this
            });
          }
        }
        issues.push({
          path: context.path,
          message: message ?? `Custom validation failed for ${this.dataType}`
        });
      }
    }
    if (issues.length > 0) {
      throw new ValidationError(issues);
    }
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
    const context = {
      rootData: data,
      path: [],
      value: data,
      ctx
    };
    const preparedValue = await this._prepare(context);
    await this._validate(preparedValue, { ...context, value: preparedValue });
    const transformedValue = await this._transform(preparedValue, {
      ...context,
      value: preparedValue
    });
    return transformedValue;
  }
  async safeParse(data, ctx) {
    try {
      const parsedData = await this.parse(data, ctx);
      return { status: "success", data: parsedData };
    } catch (e) {
      if (e instanceof ValidationError) {
        return { status: "error", error: e };
      }
      throw e;
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
function createSchemaBuilder() {
  const builder = {};
  for (const plugin of plugins) {
    if (plugin.dataType === "switch") continue;
    builder[plugin.dataType] = (config) => {
      return new Schema(plugin.dataType, config);
    };
  }
  builder.switch = (config) => {
    return new Schema("switch", config);
  };
  return builder;
}
const s = createSchemaBuilder();

exports.Schema = Schema;
exports.s = s;
