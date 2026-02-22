import { z } from "zod";
import { getEmailSchema, getNameSchema, getPhoneSchema } from "./string.js";

// 1. Person Schema
const personSchema = z.object({
  name: getNameSchema({ keyName: "Person Name" }),
  email: getEmailSchema({ keyName: "Person Email" }),
  contactNo: getPhoneSchema(),
  role: z.string().min(1, "Role is required"),
});

type PersonSchema = z.infer<typeof personSchema>;

// 2. Branch Schema
export const branchSchema = z.object({
  enterprise: z.string().min(1, "Enterprise ID/Name is required"),
  name: getNameSchema(),
  email: getEmailSchema(),
  person: personSchema,
  address: z.string().min(1, "Address is required"),
  website: z.httpUrl("Invalid website URL").optional(),
});

export type BranchSchema = z.infer<typeof branchSchema>;
