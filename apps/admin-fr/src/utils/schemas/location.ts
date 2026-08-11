import { z } from "zod";

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
  url: z
    .url("Invalid URL")
    .refine((val) => {
      try {
        const url = new URL(val);
        if (
          url.origin.includes("maps.app.goo.gl") &&
          url.pathname.match(/^\/[A-Za-z0-9]{4,}$/)
        ) {
          return true;
        }
        throw new Error("Invalid maps url");
      } catch (err) {
        return false;
      }
    }, "URL must be a valid Google Maps URL like https://maps.app.goo.gl/AbCd101")
    .optional(),
});
