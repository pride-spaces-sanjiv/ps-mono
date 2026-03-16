import { z } from "zod";
import {
  getEmailSchema,
  getNameSchema,
  getPasswordSchema,
  getPhoneSchema,
  getSlugSchema,
} from "./string.js";
import { approvalSchema } from "./dump.js";
import { personSchema } from "./person.js";

// 1. Head Quarter Person
export const headQuarterPersonSchema = personSchema;

export type HeadQuarterPersonSchema = z.infer<typeof headQuarterPersonSchema>;

// 2. Head Quarter
export const headQuarterSchema = z.object({
  address: z.string().trim().min(1, "Address is required"),
  contactNo: getPhoneSchema({ keyName: "Contact No" }),
});

export type HeadQuarterSchema = z.infer<typeof headQuarterSchema>;

// 3. Operator
export const operatorSchema = z.object({
  name: getNameSchema(),
  email: getEmailSchema(),
  password: getPasswordSchema(),
  slug: getSlugSchema({ keyName: "Operator Slug" }),
  headquarter: headQuarterSchema,
  person: headQuarterPersonSchema,
  isActive: z.boolean().optional().default(false),
  // approval: approvalSchema,
});

export type OperatorSchema = z.infer<typeof operatorSchema>;
