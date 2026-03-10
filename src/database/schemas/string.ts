import { isObjectIdOrHexString } from "mongoose";
import { minLength, z } from "zod";

type StringSchemaOptions = {
  keyName: string;
  doTrim: boolean;
  schema: z.ZodString;
};

// Id
export const getIdSchema = ({
  keyName = "Id",
  doTrim = true,
  schema = z.string(),
}: Partial<StringSchemaOptions> = {}) => {
  if (doTrim) {
    schema = schema.trim();
  }
  schema = schema.refine((val) => isObjectIdOrHexString(val), {
    error: `${keyName} is invalid`,
  });
  return schema;
};

// Name
type NameSchemaOptions = StringSchemaOptions & {
  minLength: number;
  alphaRegexp: RegExp;
  alphaRegexpMsg: string;
};
export const getNameSchema = ({
  keyName = "Name",
  doTrim = true,
  minLength = 4,
  alphaRegexp = /^[A-z ]+$/,
  alphaRegexpMsg = "must only contain alphabets",
  schema = z.string(),
}: Partial<NameSchemaOptions> = {}) => {
  if (doTrim) {
    schema = schema.trim();
  }
  if (Number.isFinite(minLength)) {
    schema = schema.min(
      minLength,
      `${keyName} must be at least ${minLength} characters long`,
    );
  }
  schema = schema.regex(alphaRegexp, `${keyName} ${alphaRegexpMsg}`);
  return schema;
};

// Email
type EmailSchemaOptions = Omit<StringSchemaOptions, "schema"> & {
  minLength: number;
  alphaRegexp: RegExp;
  alphaRegexpMsg: string;
  schema: z.ZodEmail;
};
export const getEmailSchema = ({
  keyName = "Email",
  doTrim = true,
  schema,
}: Partial<EmailSchemaOptions> = {}) => {
  schema = schema || z.email(`${keyName} is invalid`);
  if (doTrim) {
    schema = schema.trim();
  }
  return schema;
};

// Phone
type PhoneSchemaOptions = StringSchemaOptions & {
  minLength: number;
  telRegexp: RegExp;
  telRegexpMsg: string;
};
export const getPhoneSchema = ({
  keyName = "Phone No",
  doTrim = true,
  minLength = 4,
  // telRegexp = /^([0-2]|91)[0-9]{9,12}$/,
  telRegexp = /^[0-9]{9,13}$/,
  telRegexpMsg = "invalid phone number",
  schema = z.string(),
}: Partial<PhoneSchemaOptions> = {}) => {
  if (doTrim) {
    schema = schema.trim();
  }
  schema = schema.regex(telRegexp, `${keyName} ${telRegexpMsg}`);
  if (Number.isFinite(minLength)) {
    schema = schema.min(
      minLength,
      `${keyName} must be at least ${minLength} characters long`,
    );
  }
  return schema;
};

// Password
export const defaultPasswordSchemaRegexps = [
  {
    match: /[a-z]/,
    message: "must contain at least one lowercase letter",
  },
  {
    match: /[A-Z]/,
    message: "must contain at least one uppercase letter",
  },
  {
    match: /[0-9]/,
    message: "must contain at least one number",
  },
  {
    match: /[^a-zA-Z0-9 ]/,
    message: "must contain at least one symbol",
  },
];
type PasswordSchemaOptions = StringSchemaOptions & {
  minLength: number;
  regexps: typeof defaultPasswordSchemaRegexps;
};
export const getPasswordSchema = ({
  keyName = "Name",
  doTrim = true,
  minLength = 4,
  regexps = defaultPasswordSchemaRegexps,
}: Partial<PasswordSchemaOptions> = {}) => {
  let schema = z.string();
  if (doTrim) {
    schema = schema.trim();
  }
  if (Number.isFinite(minLength)) {
    schema = schema.min(
      minLength,
      `${keyName} must be at least ${minLength} characters long`,
    );
  }
  for (let i = 0; i < regexps.length; i++) {
    const regexp = regexps[i];
    schema = schema.regex(regexp.match, `${keyName} ${regexp.message}`);
  }
  return schema;
};

// Slug
type SlugSchemaOptions = StringSchemaOptions & {
  minLength: number;
  slugRegexp: RegExp;
  slugRegexpMsg: string;
};
export const getSlugSchema = ({
  keyName = "Slug",
  doTrim = true,
  minLength = 1,
  slugRegexp = /(^[a-z0-9][a-z0-9\-]+[a-z0-9]$)/,
  slugRegexpMsg = "invalid slug",
  schema = z.string(),
}: Partial<SlugSchemaOptions> = {}) => {
  if (doTrim) {
    schema = schema.trim();
  }
  // @ts-ignore
  schema = schema
    .transform((value) => value.toLowerCase().replace(/ +/g, ""))
    .superRefine((val, ctx) => {
      if (!slugRegexp.test(val)) {
        return ctx.addIssue({
          code: "invalid_value",
          values: [val],
          message: `${keyName} ${slugRegexpMsg}`,
        });
      }
      if (Number.isFinite(minLength) && val.length < minLength) {
        return ctx.addIssue({
          code: "too_small",
          minimum: minLength,
          origin: "number",
          message: `${keyName} must be at least ${minLength} characters long`,
        });
      }
    });
  return schema;
};
