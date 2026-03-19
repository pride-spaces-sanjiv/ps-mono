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
import { approvalSchema } from "./dump.js";
import { personSchema } from "./person.js";
import { spaceGrades, spaceTypes } from "@/utils/data/spaceTypes.js";

// --- Location Schema ---
export const locationSchema = z.object({
  address: z.string().trim().min(1, "Address is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  area: z.string().trim().min(1, "Area is required"),
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
  facilities: z.array(z.enum(facilities)).default([]),
  // approval: approvalSchema,
});

// TypeScript Types (Optional but recommended)
export type LocationSchema = z.infer<typeof locationSchema>;
export type SpaceSchema = z.infer<typeof spaceSchema>;
