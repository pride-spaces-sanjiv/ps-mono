import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";
import { Conn } from "../mongoose.js";
import { indexFieldsFromSchema } from "@/utils/mongoose/indexing.js";

// --- Amenities Schema ---
const AmenitySchema = new Conn.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "General",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Model Instances
export const Amenity = Conn.model("Amenity", AmenitySchema, "amenities");
indexFieldsFromSchema(AmenitySchema, {
  singleFields: ["category", "icon"],
});
Amenity.syncIndexes();

// Field Names
export const amenityFields = getFieldsOfModel(Amenity, {
  timestamps: false,
});
export const allAmenityFieldsEnabled = appendGeneralFields(amenityFields);
