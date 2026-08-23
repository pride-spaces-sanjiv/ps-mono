import { z } from "zod";
import { adminLevels } from "@pride-spaces/common/utils/data/admin.js";
import {
  getEmailSchema,
  getNameSchema,
  getPasswordSchema,
  getPhoneSchema,
} from "./string.js";

// Organization Schema
const organisationSchema = z.object({
  name: getNameSchema({ keyName: "Organization Name" }),
  location: z.string().optional(),
});

// User Schema
export const userSchema = z.object({
  name: getNameSchema(),
  email: getEmailSchema(),
  username: z.string().trim().min(3, "Username must be at least 3 characters"),
  password: getPasswordSchema(),
  isGoogleAcc: z.boolean().default(false),
  isEmailVerified: z.boolean().default(false),
  phone: getPhoneSchema(),
  organisation: organisationSchema.optional(),
});

export type UserSchema = z.infer<typeof userSchema>;

// Admin
export const adminSchema = z.object({
  name: getNameSchema(),
  email: getEmailSchema(),
  username: z.string().trim().min(3, "Username must be at least 3 characters"),
  password: getPasswordSchema(),
  isGoogleAcc: z.boolean().default(false),
  level: z.enum(adminLevels).default("support"),
  phone: getPhoneSchema(),
  isActive: z.boolean("Active status must be yes or no").default(true),
});

export type AdminSchema = z.infer<typeof adminSchema>;
