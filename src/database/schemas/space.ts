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
import { workingSizes } from "@/utils/data/workingSizes.js";
import { filesSchema } from "./files.js";
import { locationSchema } from "./location.js";

// --- Location Schema ---
// Specs
const specsSchema = z.object({
  category: z.enum(spaceCategories).default("Starter"),
  spaceType: z.enum(spaceTypes).default("Flex"),
  grade: z.enum(spaceGrades).default("B"),
  area: z.number().min(0, "Area must be a positive number").optional(),
  workingSizes: z.array(z.enum(workingSizes)).default([]),
});

// Timing
const timingSchema = z.object({
  openTime: z.date().optional(),
  closeTime: z.date().optional(),
  openDays: z.array(
    z
      .number()
      .int("Day must be an integer")
      .positive("Day must be a positive integer")
      .min(1, "Day must be atleast 1")
      .max(7, "Day must be atmost 7"),
  ),
  operationalHrs: z
    .number()
    .int("Operational hours must be an integer")
    .min(0, "Operational hours must be a positive number")
    .max(24, "Operational hours must be at most 24")
    .default(0),
  operationalSince: z
    .number("Operational Since must be a valid year")
    .int("Operational Since must be a valid year")
    .min(1800, "Operational Since must be a year after 1800")
    .max(
      new Date().getFullYear(),
      `Operational Since must be before or equal to the current year`,
    )
    .optional(),
});

// Seats
const seatsSchema = z.object({
  total: z
    .number()
    .min(0)
    .int("Total seats must be a positive integer")
    .default(0),
  booked: z
    .number()
    .min(0)
    .int("Booked seats must be a positive integer")
    .default(0),
});

// Flags
const flagsSchema = z.object({
  isOc: z.boolean().default(false).optional(),
  isSez: z.boolean().default(false).optional(),
  isVerified: z.boolean().default(false).optional(),
  isActive: z.boolean().default(false).optional(),
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
  meetingRoom: z
    .number()
    .min(0, "Meeting Room price must be a positive number")
    .default(0),
  flexiDesk: z
    .number()
    .min(0, "Flexi desk price must be a positive number")
    .default(0),
  privateCabin: z
    .number()
    .min(0, "Private cabin price must be a positive number")
    .default(0),
  vo: z.number().min(0, "VO price must be a positive number").default(0),
});

// --- Space Schema ---
export const spaceSchema = z.object({
  branch: getIdSchema({ keyName: "Branch ID" }).optional(),
  operator: getIdSchema({ keyName: "Operator ID" }),
  name: getNameSchema({
    keyName: "Space Name",
    alphaRegexp: /^[A-Za-z0-9,\- ]+$/,
    alphaRegexpMsg: "must only contain alpha numeric characters",
  }),
  email: getEmailSchema().optional(),
  location: locationSchema,
  person: personSchema,
  slug: getSlugSchema({ keyName: "Space Slug" }),
  specs: specsSchema,
  timing: timingSchema,
  seats: seatsSchema,
  flags: flagsSchema,
  description: z.string().optional(),
  rating: z.number().optional().default(0),
  reviews: z.number().optional().default(0),
  price: z
    .number()
    .min(0, "Price must be a positive number")
    .int("Price must be a positive integer"),
  pricing: pricingSchema,
  facilities: z.array(getIdSchema({ keyName: "Facility ID" })).default([]),
  files: filesSchema.partial().optional(),
  // approval: approvalSchema,
});

// TypeScript Types (Optional but recommended)
export type LocationSchema = z.infer<typeof locationSchema>;
export type PricingSchema = z.infer<typeof pricingSchema>;
export type SpaceSchema = z.infer<typeof spaceSchema>;
