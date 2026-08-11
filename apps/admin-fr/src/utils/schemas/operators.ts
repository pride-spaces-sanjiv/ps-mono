import { z } from "zod";
import {
  getEmailSchema,
  getNameSchema,
  getPasswordSchema,
  getPhoneSchema,
  getSlugSchema,
} from "./string.js";

const gstNoSchema = z
  .string()
  .trim()
  .min(1, "GST number is required")
  .refine(
    (v) => v.match(/^[A-Za-z0-9]{15}$/),
    "GST number must be 15 characters long",
  );

// 1. Head Quarter Person
export const headQuarterPersonSchema = z.object({
  name: getNameSchema({
    keyName: "POC Name",
    alphaRegexp: /^[A-Za-z0-9, ]+$/,
    alphaRegexpMsg: "must only contain alpha numeric characters",
  }),
  email: getEmailSchema({ keyName: "POC Email" }),
  contactNo: getPhoneSchema({ keyName: "POC Contact Number" }),
  role: z.string().trim().min(1, "POC Designation is required"),
});

export type HeadQuarterPersonSchema = z.infer<typeof headQuarterPersonSchema>;

// 2. Head Quarter
export const headQuarterSchema = z.object({
  address: z.string().trim().min(1, "HQ Address is required"),
  contactNo: getPhoneSchema({ keyName: "HQ Contact No" }),
});

export type HeadQuarterSchema = z.infer<typeof headQuarterSchema>;

// 3. Branch
export const branchSchema = z.object({
  code: z.string().trim().min(1, "State Code is required"),
  name: z.string().trim().min(1, "State Name is required"),
  address: z.string().trim().min(1, "Branch Address is required"),
  city: z.string().trim().min(1, "City is required"),
  gstNo: gstNoSchema.optional(),
  postalCode: z
    .string("Postal Code is required")
    .trim()
    .min(3, "Postal Code must be min 3 chars")
    .transform((arg) => arg.replace(/[^A-Za-z0-9]/g, ""))
    .refine((val) => /^[A-Za-z0-9]+$/.test(val), "Postal Code is invalid"),
  person: headQuarterPersonSchema.partial().optional(),
  isPrimary: z.boolean().default(false),
});

export type BranchSchema = z.infer<typeof branchSchema>;

// 4. Operator
export const operatorSchema = z.object({
  name: getNameSchema({
    keyName: "Operator Name",
    alphaRegexp: /^[A-Za-z0-9,\- ]+$/,
    alphaRegexpMsg: "must only contain alpha numeric characters",
  }),
  email: getEmailSchema(),
  password: getPasswordSchema(),
  slug: getSlugSchema({ keyName: "Operator Slug" }),
  brandName: getNameSchema({
    keyName: "Brand Name",
    alphaRegexp: /^[A-Za-z0-9,\- ]+$/,
    alphaRegexpMsg: "must only contain alpha numeric characters",
  }),
  gstNo: gstNoSchema,
  cinNo: z
    .string()
    .trim()
    .refine((v) => !v.match(/ +/), "CIN cannot have spaces")
    .optional(),
  headquarter: headQuarterSchema.partial().optional(),
  branches: z.array(branchSchema).optional(),
  person: headQuarterPersonSchema.partial().optional(),
  establishedOn: z.date().optional(),
  isActive: z.boolean().optional().default(true),
  // approval: approvalSchema,
});

export type OperatorSchema = z.infer<typeof operatorSchema>;
