import z from "zod";
import { getNameSchema } from "./string.js";

// --- Amenity Schema ---
export const amenitySchema = z.object({
  name: getNameSchema({
    keyName: "Name",
    alphaRegexp: /^((.| )+)$/,
    minLength: 2,
  }),
  icon: z.string().trim().min(1, "Icon is required"),
  category: z.string().trim().min(1, "Category is required").optional(),
  isActive: z.boolean().default(true),
});

export type AmenitySchema = z.infer<typeof amenitySchema>;
