import { z } from "zod";
import {
  getEmailSchema,
  getIdSchema,
  getNameSchema,
  getSlugSchema,
  getPhoneSchema,
} from "./string.js";
import { facilities } from "@/utils/data/facilities.js";
import { spaceCategories } from "@/utils/data/category.js";
import { spaceTypes, spaceGrades } from "../data/spaceTypes.js";
import { workingSizes } from "@/utils/data/workingSizes.js";

// Person Schema
export const personSchema = z.object({
  name: getNameSchema({
    keyName: "POC Name",
    alphaRegexp: /^[A-Za-z0-9, ]+$/,
    alphaRegexpMsg: "must only contain alpha numeric characters",
  }),
  email: getEmailSchema({ keyName: "POC Email" }),
  contactNo: getPhoneSchema({ keyName: "POC Contact Number" }),
  role: z.string().trim().min(1, "POC Designation is required"),
});

// --- Location Schema ---
export const locationSchema = z.object({
  address: z.string().trim().min(1, "Address is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  country: z.string().trim().min(1, "Country is required"),
  area: z.string().trim().min(1, "Area is required"),
  postalCode: z
    .string("Postal Code is required")
    .trim()
    .min(3, "Postal Code must be min 3 chars")
    .transform((arg) => arg.replace(/[^A-Za-z0-9]/g, ""))
    .refine((val) => /^[A-Za-z0-9]+$/.test(val), "Postal Code is invalid"),
  lat: z.number(),
  lng: z.number(),
});

// --- Pricing
export const pricingSchema = z.object({
  dayPass: z
    .number()
    .min(0, "Day pass price must be a positive number")
    .default(0),
  perSeat: z
    .number()
    .min(0, "Per seat price must be a positive number")
    .default(0),
  dedicatedDesk: z
    .number()
    .min(0, "Dedicated desk price must be a positive number")
    .default(0),
  flexiDesk: z
    .number()
    .min(0, "Flexi desk price must be a positive number")
    .default(0),
  privateCabin: z
    .number()
    .min(0, "Private cabin price must be a positive number")
    .default(0),
});

// --- Space Schema ---
export const spaceSchema = z.object({
  branch: getIdSchema({ keyName: "Branch ID" }),
  operator: getIdSchema({ keyName: "Operator ID" }),
  name: getNameSchema({
    keyName: "Space Name",
    alphaRegexp: /^[A-Za-z0-9,\- ]+$/,
    alphaRegexpMsg: "must only contain alpha numeric characters",
  }),
  email: getEmailSchema(),
  location: locationSchema,
  person: personSchema,
  slug: getSlugSchema({ keyName: "Space Slug" }),
  area: z.number().min(0, "Area must be a positive number").optional(),
  category: z.enum(spaceCategories).default("Classic"),
  spaceType: z.enum(spaceTypes).default("Flex"),
  grade: z.enum(spaceGrades).default("B"),
  description: z.string().optional(),
  openTime: z.date().optional(),
  closeTime: z.date().optional(),
  openDays: z.array(
    z
      .number()
      .int("Day must be an integer")
      .positive("Day must be a positive integer")
      .min(1, "Day must be atleast 1")
      .max(7, "Day must be at most 7"),
  ),
  operationalHrs: z
    .number()
    .int("Operational hours must be an integer")
    .min(0, "Operational hours must be a positive number")
    .max(24, "Operational hours must be at most 24")
    .default(0),
  isVerified: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(false),
  rating: z.number().optional().default(0),
  reviews: z.number().optional().default(0),
  totalSeats: z
    .number()
    .min(0)
    .int("Total seats must be a positive integer")
    .default(0),
  bookedSeats: z
    .number()
    .min(0)
    .int("Booked seats must be a positive integer")
    .default(0),
  price: z
    .number()
    .min(0, "Price must be a positive number")
    .int("Price must be a positive integer"),
  facilities: z.array(getIdSchema({ keyName: "Facility" })).default([]),
  workingSizes: z.array(z.enum(workingSizes)).default([]),
  pricing: pricingSchema,
  // approval: approvalSchema,
});

// TypeScript Types (Optional but recommended)
export type LocationSchema = z.infer<typeof locationSchema>;
export type SpaceSchema = z.infer<typeof spaceSchema>;
export type PricingSchema = z.infer<typeof pricingSchema>;
