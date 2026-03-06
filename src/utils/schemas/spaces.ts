import * as yup from "yup";

export const locationSchema = yup.object().shape({
  address: yup
    .string()
    .required("Address is required")
    .trim("Address cannot be empty"),

  city: yup
    .string()
    .required("City is required")
    .trim("City cannot be empty"),

  state: yup
    .string()
    .required("State is required")
    .trim("State cannot be empty"),

  postalCode: yup
    .string()
    .required("Postal Code is required")
    .trim("Postal Code cannot be empty"),

  country: yup
    .string()
    .required("Country is required")
    .trim("Country cannot be empty"),

  lat: yup
    .number()
    .required("Latitude is required"),

  lng: yup
    .number()
    .required("Longitude is required"),
});
export const spaceSchema = yup.object().shape({
  branch: yup
    .string()
    .required("Branch ID is required")
    .trim("Branch ID cannot be empty"),

  enterprise: yup
    .string()
    .required("Enterprise ID is required")
    .trim("Enterprise ID cannot be empty"),

  name: yup
    .string()
    .required("Space Name is required")
    .trim("Space Name cannot be empty")
    .min(3, "Minimum 3 characters required")
    .test(
      "invalid-chars",
      "Space Name must only contain alphabets",
      (val) => !!val?.match(/^[A-z ]+$/)
    ),

  email: yup
    .string()
    .required("Email is required")
    .email("Email is invalid")
    .trim("Email cannot be empty"),

  location: locationSchema.required("Location is required"),

  description: yup.string().optional(),

  openTime: yup.date().optional(),

  closeTime: yup.date().optional(),

  openDays: yup
    .number()
    .optional()
    .min(1, "Minimum 1 day required")
    .max(7, "Maximum 7 days allowed")
    .integer("Open days must be integer"),

  isVerified: yup.boolean().default(false),

  isActive: yup.boolean().default(false),

  rating: yup
    .number()
    .default(0)
    .min(0, "Rating cannot be less than 0")
    .max(5, "Rating cannot exceed 5"),

  reviews: yup
    .number()
    .default(0)
    .min(0, "Reviews cannot be negative")
    .integer("Reviews must be integer"),
});
export const createSpaceSchema = spaceSchema.pick([
  "branch",
  "enterprise",
  "name",
  "email",
  "location",
  "description",
  "openTime",
  "closeTime",
  "openDays",
  "isVerified",
  "isActive",
  "rating",
  "reviews",
]);


export type CreateSpaceSchema = yup.InferType<typeof createSpaceSchema>;