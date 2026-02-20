import { Conn } from "@/database/mongoose.js";
import { ModelDocumentKeys } from "@/types/mongoose/document.js";
import { allGeneralFieldsEnabled } from "@/utils/mongoose/fields.js";

export const amenities = ["pool", "cabin", "wifi"] as const;
export type Amenity = (typeof amenities)[number];

const SpacesSchema = new Conn.Schema(
  {
    name: { type: String, required: true },
    provider: { type: String, required: true },
    email: { type: String },
    amenities: {
      type: [String],
      enum: amenities,
      required: true,
    },
    totalSeats: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);
SpacesSchema.index({ name: 1 });

// Model Instances
export const Spaces = Conn.model("Spaces", SpacesSchema, "spaces");

// Field names
export const spacesFields = Object.keys(SpacesSchema.paths).filter(
  (k) => k !== "createdAt" && k !== "updatedAt",
) as ModelDocumentKeys<typeof Spaces>[];

export const allSpacesFieldsEnabled = {
  ...(Object.fromEntries(spacesFields.map((f) => [f, 1])) as {
    [K in Exclude<ModelDocumentKeys<typeof Spaces>, "id">]: 1;
  }),
  ...allGeneralFieldsEnabled,
};
