import z from "zod";
import { getNameSchema } from "./string.js";

// --- Amenities Schema ---
export const amenitiesSchema = z.object({
  name: getNameSchema({ keyName: "Name" }),
  icon: z.string().trim().min(1, "Icon is required"),
  category: z.string().trim().min(1, "Category is required").optional(),
  isActive: z.boolean().default(true),
});

export type AmenitiesSchema = z.infer<typeof amenitiesSchema>;
