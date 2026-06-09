import { z } from "zod";
import {
  getNameSchema,
  getEmailSchema,
  getIdSchema,
  getSlugSchema,
  getPhoneSchema,
} from "./string.js";
import { personSchema } from "./person.js";
import {
  dealStatuses,
  esgScores,
  furnishStatuses,
  greenCerts,
  occupancyStatuses,
  ownershipTypes,
  sources,
} from "@/utils/data/conventional.js";
import { spaceGrades } from "@/utils/data/spaceTypes.js";
import { approvalSchema } from "./dump.js";

// --- Sub-Schemas ---

export const locationSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  area: z.string().min(1, "Area is required"),
  postalCode: z.string().optional(),
  landmark: z.string().optional(),
  lat: z.number("Latitude must be a number"),
  lng: z.number("Longitude must be a number"),
});

export const distanceDiffSchema = z.object({
  airport: z.number().optional(),
  metro: z.number().optional(),
  cbd: z.number().optional(),
});

export const totalMetricsSchema = z.object({
  floors: z.number().default(0),
  towers: z.number().default(0),
});

export const areaSchema = z.object({
  totalBuiltArea: z.number().default(0),
  totalLeasedArea: z.number().default(0),
  floorPlateSize: z.number().default(0),
  availableArea: z.number().default(0),
  minDivHeight: z.number().default(0),
  ceilingHeight: z.number().default(0),
});

export const specsSchema = z.object({
  powerBackup: z.number().default(0),
  hvacType: z.string().optional(),
  liftCount: z.number().default(0),
  parkingRatio: z.array(z.number()).default([]),
  greenCert: z.enum(greenCerts, "Invalid green certification type").optional(),
  lockInPeriod: z.number().default(0),
  leaseTerm: z.number().default(0),
  ownershipType: z.enum(ownershipTypes, "Invalid ownership type").optional(),
  occupancyStatus: z
    .enum(occupancyStatuses, "Invalid occupancy status")
    .optional(),
  furnishStatus: z
    .enum(furnishStatuses, "Invalid furnishing status")
    .optional(),
  source: z.enum(sources, "Invalid source option").optional(),
  dealStatus: z.enum(dealStatuses, "Invalid deal status").optional(),
  esgScore: z.enum(esgScores, "Invalid ESG score").optional(),
  vacancy: z.number().default(0),
  internetProviders: z.array(z.string()).default([]),
  nearbyInfras: z.array(z.string()).default([]),
  tenantMix: z.string().optional(),
  anchorTenants: z.array(z.string()).default([]),
});

export const pricingSchema = z.object({
  rent: z.number().default(0),
  camCharge: z.number().default(0),
  depositMonths: z.number().default(0),
  escalation: z.number().default(0),
  parkingCharge: z.number().default(0),
});

// --- Main Schema ---

export const conventionalPropertySchema = z.object({
  name: getNameSchema({ keyName: "Name" }),
  slug: getSlugSchema({ keyName: "Slug" }),
  developer: getIdSchema({ keyName: "Developer Id" }),
  type: z.string().min(1, "Type is required"),
  completionYear: z.number().optional(),
  grade: z.enum(spaceGrades, "Invalid property grade").default("B"),
  totalMetrics: totalMetricsSchema.optional(),
  location: locationSchema.optional(),
  distanceDiffs: distanceDiffSchema.optional(),
  area: areaSchema.optional(),
  specs: specsSchema.optional(),
  pricing: pricingSchema.optional(),
  facilities: z.array(z.string()).optional(),
  person: personSchema.optional(),
  gstNo: z.string().optional(),
  approval: approvalSchema.optional(),
  canImmediateAvail: z.boolean().default(false),
  isSez: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// Infer the TypeScript type
export type ConventionalPropertySchema = z.infer<
  typeof conventionalPropertySchema
>;
