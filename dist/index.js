const stringValidatorMap = {
  string: {
    identity: (value) => typeof value === "string",
    length: (value, [length]) => value.length === length,
    minLength: (value, [minLength]) => value.length >= minLength,
    maxLength: (value, [maxLength]) => value.length <= maxLength,
    range: (value, [[min, max]]) => value.length >= min && value.length <= max,
    exclusiveRange: (value, [[min, max]]) => value.length > min && value.length < max,
    pattern: (value, [pattern]) => pattern.test(value),
    oneOf: (value, [options]) => options.includes(value)
  }
};

const numberValidatorMap = {
  number: {
    identity: (value) => typeof value === "number" && !isNaN(value),
    min: (value, [min]) => value >= min,
    max: (value, [max]) => value <= max,
    range: (value, [[min, max]]) => value >= min && value <= max,
    exclusiveRange: (value, [[min, max]]) => value > min && value < max,
    integer: (value) => Number.isInteger(value),
    positive: (value) => value > 0,
    negative: (value) => value < 0,
    zero: (value) => value === 0,
    float: (value) => !Number.isInteger(value),
    multipleOf: (value, [multipleOf]) => value % multipleOf === 0,
    even: (value) => value % 2 === 0,
    odd: (value) => value % 2 !== 0
  }
};

const booleanValidatorMap = {
  boolean: {
    identity: (value) => typeof value === "boolean",
    required: (value) => typeof value === "boolean"
  }
};

const arrayValidatorMap = {
  array: {
    identity: (value) => Array.isArray(value),
    length: (value, [length]) => value.length === length,
    minLength: (value, [minLength]) => value.length >= minLength,
    maxLength: (value, [maxLength]) => value.length <= maxLength,
    nonEmpty: (value) => value.length > 0,
    contains: (value, [element]) => value.includes(element),
    excludes: (value, [element]) => !value.includes(element),
    unique: (value) => new Set(value).size === value.length,
    ofType: (value, [schema], context) => {
      for (const [i, item] of value.entries()) {
        schema.parse({
          ...context,
          path: [...context.path, i],
          value: item
        });
      }
      return true;
    },
    items: (value, [schemas], context) => {
      if (value.length !== schemas.length) {
        return false;
      }
      for (const [i, schema] of schemas.entries()) {
        schema.parse({
          ...context,
          path: [...context.path, i],
          value: value[i]
        });
      }
      return true;
    }
  }
};

const objectValidatorMap = {
  object: {
    identity: (value) => typeof value === "object" && value !== null && !Array.isArray(value),
    properties: (value, [properties], context) => {
      if (typeof value !== "object" || value === null) return false;
      for (const key in properties) {
        const schema = properties[key];
        if (!Object.prototype.hasOwnProperty.call(value, key)) {
          if (schema.config.optional) {
            continue;
          }
          return false;
        }
        const propertyValue = value[key];
        schema.parse({
          ...context,
          path: [...context.path, key],
          value: propertyValue
        });
      }
      return true;
    }
  }
};

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const getDomain = (email) => email.substring(email.lastIndexOf("@") + 1);
const emailValidatorMap = {
  email: {
    identity: (value) => typeof value === "string" && EMAIL_REGEX.test(value),
    domain: (email, [config]) => {
      const domain = getDomain(email);
      if (config.deny) {
        for (const rule of config.deny) {
          if (rule instanceof RegExp ? rule.test(domain) : rule === domain) {
            return false;
          }
        }
      }
      if (config.allow) {
        for (const rule of config.allow) {
          if (rule instanceof RegExp ? rule.test(domain) : rule === domain) {
            return true;
          }
        }
        return false;
      }
      return true;
    }
  }
};

const jsonValidatorMap = {
  json: {
    identity: (value) => typeof value === "string",
    schema: (value, [schema], context) => {
      try {
        const parsed = JSON.parse(value);
        schema.parse({ ...context, value: parsed });
        return true;
      } catch (e) {
        return false;
      }
    }
  }
};

const validatorMap = mergeValidatorMaps(
  stringValidatorMap,
  numberValidatorMap,
  booleanValidatorMap,
  arrayValidatorMap,
  objectValidatorMap,
  emailValidatorMap,
  jsonValidatorMap
);
function mergeValidatorMaps(...maps) {
  const result = {};
  for (const map of maps) {
    Object.assign(result, map);
  }
  return result;
}

function isValidationContext(thing) {
  return typeof thing === "object" && thing !== null && "rootData" in thing && "path" in thing && "value" in thing;
}
class Schema {
  validators = [];
  dataType;
  config;
  constructor(dataType, config = {}, validatorMap2) {
    this.dataType = dataType;
    this.config = config;
    const validatorCollection = validatorMap2[dataType];
    if (validatorCollection?.identity) {
      this.validators.push({
        name: "identity",
        validator: validatorCollection.identity,
        args: []
      });
    }
    for (const [validatorName, validatorConfig] of Object.entries(config)) {
      if (validatorName === "optional" || validatorName === "nullable") {
        continue;
      }
      const validator = validatorCollection?.[validatorName];
      if (validator) {
        const args = validatorConfig !== void 0 && validatorConfig !== true ? [validatorConfig] : [];
        this.validators.push({
          name: validatorName,
          validator,
          args
        });
      }
    }
  }
  parse(dataOrContext) {
    const context = isValidationContext(dataOrContext) ? dataOrContext : {
      rootData: dataOrContext,
      path: [],
      value: dataOrContext
    };
    return this._parse(context);
  }
  _parse(context) {
    if (this.config.optional && context.value === void 0) {
      return context.value;
    }
    if (this.config.nullable && context.value === null) {
      return context.value;
    }
    for (const { name, validator, args } of this.validators) {
      if (!validator(context.value, args, context)) {
        const path = context.path.join(".");
        const messages = this.config.messages;
        const customMessage = messages?.[name];
        if (customMessage) {
          throw new Error(customMessage);
        }
        throw new Error(
          `Validation failed for ${this.dataType}.${name} at path '${path}'`
        );
      }
    }
    return context.value;
  }
}
class SwitchSchema extends Schema {
  keyFn;
  schemas;
  defaultSchema;
  constructor(keyFn, schemas, defaultSchema) {
    super("switch", {}, validatorMap);
    this.keyFn = keyFn;
    this.schemas = schemas;
    this.defaultSchema = defaultSchema;
  }
  _parse(context) {
    const key = this.keyFn(context);
    const schema = this.schemas[key] || this.defaultSchema;
    if (schema) {
      return schema.parse(context);
    }
    return context.value;
  }
}
function createSchemaFunction(dataType, validatorMap2) {
  return function(config) {
    return new Schema(
      dataType,
      config || {},
      validatorMap2
    );
  };
}
function createSchemaBuilder(validatorMap2) {
  const builder = {};
  for (const dataType in validatorMap2) {
    builder[dataType] = createSchemaFunction(dataType, validatorMap2);
  }
  builder.switch = (keyFn, schemas, defaultSchema) => {
    return new SwitchSchema(keyFn, schemas, defaultSchema);
  };
  return builder;
}
const s = createSchemaBuilder(validatorMap);

export { Schema, createSchemaBuilder, s };
