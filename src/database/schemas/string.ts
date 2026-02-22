import { minLength, z } from "zod";

type StringSchemaOptions = {
  keyName: string;
  doTrim: boolean;
  schema: z.ZodString;
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
  schema = schema.regex(alphaRegexp, `${keyName}${alphaRegexpMsg}`);
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
  telRegexp = /^([0-2]|91)[0-9]{9,10}$/,
  telRegexpMsg = "invalid phone number",
  schema = z.string(),
}: Partial<PhoneSchemaOptions> = {}) => {
  if (doTrim) {
    schema = schema.trim();
  }
  schema = schema.regex(telRegexp, `${keyName}${telRegexpMsg}`);
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
