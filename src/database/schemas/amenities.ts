import z from "zod";

// --- Amenities Schema ---
export const amenitiesSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    icon: z.string().trim().min(1, "Icon is required"),
    type: z.string().trim().min(1, "Type is required"),
    status: z.string().trim().min(1, "Status is required"),
})

export type AmenitiesSchema = z.infer<typeof amenitiesSchema>;