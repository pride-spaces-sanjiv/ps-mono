import { z } from "zod";
import {
  getEmailSchema,
  getNameSchema,
  getPasswordSchema,
  getPhoneSchema,
} from "./string.js";

// 1. Head Quarter Person
export const headQuarterPersonSchema = z.object({
  name: getNameSchema({ keyName: "Person Name" }),
  email: getEmailSchema({ keyName: "Person Email" }),
  role: z.string().trim().min(1, "Role is required"),
});

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
  headquarter: headQuarterSchema,
  person: headQuarterPersonSchema,
});

export type OperatorSchema = z.infer<typeof operatorSchema>;
