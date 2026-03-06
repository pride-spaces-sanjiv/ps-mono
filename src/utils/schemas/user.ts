import { z } from "zod";
import { adminLevels } from "@/utils/data/admin.js";
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
});

export type AdminSchema = z.infer<typeof adminSchema>;

// Login
export const loginSchema = adminSchema.pick({ email: true, password: true });
export type LoginSchema = z.infer<typeof loginSchema>;
