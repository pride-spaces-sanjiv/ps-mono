import * as yup from "yup";
import { isValidPhoneNumber } from "react-phone-number-input";

export const loginSchema = yup.object().shape({
  email: yup.string().required("Email is required").email("Email is invalid"),
  password: yup
    .string()
    .required("Password is required")
    .trim("Password cannot be empty")
    .min(8, "Minimum 8 characters required")
    .test(
      "no-uppercase-letter",
      "Atleast 1 uppercase letter required",
      (val) => !!val.match(/[A-Z]/)
    )
    .test(
      "no-lowercase-letter",
      "Atleast 1 lowercase letter required",
      (val) => !!val.match(/[a-z]/)
    )
    .test(
      "no-number",
      "Atleast 1 number required",
      (val) => !!val.match(/[0-9]/)
    )
    .test(
      "no-symbol",
      "Atleast 1 symbol required",
      (val) => !!val.match(/[^A-z0-9 ]/)
    ),
});
export type LoginSchema = yup.InferType<typeof loginSchema>;
export const refreshTokenSchema = yup.object().shape({
  refreshToken: yup
    .string()
    .required("Refresh Token is required")
    .email("Refresh Token is empty"),
});
export type RefreshTokenSchema = yup.InferType<typeof refreshTokenSchema>;

export const googleAuthSchema = yup.object().shape({
  code: yup.string().required("Code is required").trim("Code cannot be empty"),
});
export type GoogleAuthSchema = yup.InferType<typeof googleAuthSchema>;

export const resetPasswordSchema = loginSchema.pick(["password"]).concat(
  yup.object().shape({
    token: yup.string().required("Token is required").trim("Token is empty"),
  })
);
export type ResetPasswordSchema = yup.InferType<typeof resetPasswordSchema>;

const checkPhoneNum = (val: number) =>
  String(val).length === 10 && isValidPhoneNumber(`+91${val}`);

export const userSchema = yup.object().shape({
  name: yup
    .string()
    .required("Name is required")
    .trim("Name cannot be empty")
    .min(4, "Minimum 4 letters required")
    .test("invalid-chars", "Only alphanumeric characters allowed", (val) => {
      return !!val.match(/^[A-z0-9 ]+$/);
    }),
  email: yup.string().when("level", {
    is: 0,
    then: (s) => s.optional().email("Email is invalid").trim("Email is empty"),
    otherwise: (s) =>
      s
        .required("Email is required")
        .email("Email is invalid")
        .trim("Email is empty"),
  }),
  username: yup.string().required("Username is required"),
  password: yup
    .string()
    .required("Password is required")
    .trim("Password cannot be empty"),
  level: yup
    .number()
    .default(0)
    .required("Level is required")
    .min(0, "Level must be within [0-3]")
    .max(3, "Level must be within [0-3]"),
  verified: yup
    .boolean()
    .default(false)
    .required("Verified status is required"),
  underUser: yup.string().when("level", {
    is: 0,
    then: (s) => s.required("User Id is invalid").trim("User Id is empty"),
    otherwise: (s) => s.optional().trim("User Id is empty"),
  }),
  credits: yup
    .number()
    .default(0)
    .required("Credits required")
    .min(0, "Credits must be atleast 0")
    .integer("Credits must be integer"),
  enabledGroups: yup
    .array()
    .default([])
    .of(yup.string().required("Group Id is invalid").trim("Group Id is empty"))
    .min(0),
  isActive: yup.boolean().default(false).required("Active status required"),
  userAgents: yup
    .array()
    .default([])
    .of(
      yup
        .string()
        .required("User Agent is required")
        .trim("User Agent cannot be empty")
    )
    .min(0),
  phone: yup.number().when("level", {
    is: 1,
    then: (s) =>
      s
        .required("Phone number is required")
        .min(1, "Invalid phone number")
        .integer("Invalid phone number")
        .test("invalid-phone-no", "Invalid phone number", (val) =>
          checkPhoneNum(val)
        ),
    otherwise: (s) =>
      s
        .optional()
        .notRequired()
        .min(1, "Invalid phone number")
        .integer("Invalid phone number")
        .test("invalid-phone-no", "Invalid phone number", (val) => {
          if (typeof val === "undefined" || (typeof val === "object" && !val)) {
            return true;
          }
          return checkPhoneNum(val);
        }),
  }),
  expiry: yup.date().default(undefined),
});
export type UserSchema = yup.InferType<typeof userSchema>;

export const createUserSchema = userSchema
  .pick([
    "name",
    "level",
    "enabledGroups",
    "email",
    "phone",
    "expiry",
    "credits",
    "isActive",
  ])
  .concat(
    yup.object().shape({
      loginPassword: loginSchema.fields.password as yup.StringSchema<
        string,
        yup.AnyObject,
        undefined,
        ""
      >,
    })
  );

export type CreateUserSchema = yup.InferType<typeof createUserSchema>;

export const passwordUserChangeSchema = loginSchema.pick(["password"]).concat(
  yup.object().shape({
    newPassword: (loginSchema.fields.password as yup.StringSchema<string>)
      .clone()
      .required("New Password is required")
      .notOneOf([yup.ref("password")], "New password cannot be same as old"),
    confirmPassword: (loginSchema.fields.password as yup.StringSchema<string>)
      .clone()
      .oneOf(
        [yup.ref("newPassword")],
        "Confirm password must match new password"
      ),
  })
);
export type PasswordUserChangeSchema = yup.InferType<
  typeof passwordUserChangeSchema
>;

export const extendUserPlaylistSchema = yup.object().shape({
  credits: yup
    .number()
    .default(1)
    .required("No of Months is required")
    .integer("Months must be integer")
    .min(1, "Must be atleast 1 month")
    .max(24, "Must be max 24 months"),
});

export type ExtendUserPlaylistSchema = yup.InferType<
  typeof extendUserPlaylistSchema
>;
