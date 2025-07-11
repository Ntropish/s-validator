import { ValidatorCollection } from "./types.js";

// This regex requires at least one dot in the domain part.
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const getDomain = (email: string) =>
  email.substring(email.lastIndexOf("@") + 1);

type DomainConfig = {
  allow?: (string | RegExp)[];
  deny?: (string | RegExp)[];
};

export const emailValidatorMap = {
  email: {
    identity: (value: unknown): value is string =>
      typeof value === "string" && EMAIL_REGEX.test(value),
    domain: (email: string, [config]: [DomainConfig]) => {
      const domain = getDomain(email);

      // Deny rules take precedence.
      if (config.deny) {
        for (const rule of config.deny) {
          if (rule instanceof RegExp ? rule.test(domain) : rule === domain) {
            return false; // Domain is in the deny list.
          }
        }
      }

      // If allow rules exist, the domain must match one of them.
      if (config.allow) {
        for (const rule of config.allow) {
          if (rule instanceof RegExp ? rule.test(domain) : rule === domain) {
            return true; // Domain is in the allow list.
          }
        }
        return false; // Domain is not in the allow list.
      }

      return true; // Passes if no allow/deny rules are broken.
    },
  } satisfies ValidatorCollection<string>,
} as const;
