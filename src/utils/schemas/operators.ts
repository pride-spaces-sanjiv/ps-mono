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
  gstNo: gstNoSchema,
  person: headQuarterPersonSchema,
});

export type BranchSchema = z.infer<typeof branchSchema>;

// 4. Operator
export const operatorSchema = z.object({
  name: getNameSchema(),
  email: getEmailSchema(),
  password: getPasswordSchema(),
  slug: getSlugSchema({ keyName: "Operator Slug" }),
  brandName: getNameSchema({ keyName: "Brand Name" }),
  gstNo: gstNoSchema,
  cinNo: z
    .string()
    .trim()
    .min(1, "CIN number is required")
    .refine(
      (v) => v.match(/^[A-Za-z0-9]{21}$/),
      "CIN number must be 21 characters long",
    ),
  headquarter: headQuarterSchema,
  branches: z.array(branchSchema).optional(),
  person: headQuarterPersonSchema,
  isActive: z.boolean().optional().default(true),
  // approval: approvalSchema,
});

export type OperatorSchema = z.infer<typeof operatorSchema>;
