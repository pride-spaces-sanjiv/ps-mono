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

// Person Schema
export const personSchema = z.object({
  name: getNameSchema({
    keyName: "Person Name",
    alphaRegexp: /^[A-Za-z0-9, ]+$/,
    alphaRegexpMsg: "must only contain alpha numeric characters",
  }),
  email: getEmailSchema({ keyName: "Person Email" }),
  contactNo: getPhoneSchema({ keyName: "Person Contact Number" }),
});

// --- Location Schema ---
export const locationSchema = z.object({
  address: z.string().trim().min(1, "Address is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().min(1, "Country is required"),
  lat: z.number(),
  lng: z.number(),
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
  category: z.enum(spaceCategories).default("Classic"),
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
  facilities: z.array(z.enum(facilities)).default([]),
});

// TypeScript Types (Optional but recommended)
export type LocationSchema = z.infer<typeof locationSchema>;
export type SpaceSchema = z.infer<typeof spaceSchema>;