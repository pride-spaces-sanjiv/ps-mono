import { z } from "zod";
import {
  getEmailSchema,
  getIdSchema,
  getNameSchema,
  getSlugSchema,
} from "./string.js";

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
  name: getNameSchema({ keyName: "Space Name" }),
  email: getEmailSchema(),
  location: locationSchema,
  slug: getSlugSchema({ keyName: "Space Slug" }),
  description: z.string().optional(),
  openTime: z.date().optional(),
  closeTime: z.date().optional(),
  openDays: z.number().optional(),
  isVerified: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(false),
  rating: z.number().optional().default(0),
  reviews: z.number().optional().default(0),
  totalSeats: z.number().default(0),
  bookedSeats: z.number().default(0),
});

// TypeScript Types (Optional but recommended)
export type LocationSchema = z.infer<typeof locationSchema>;
export type SpaceSchema = z.infer<typeof spaceSchema>;