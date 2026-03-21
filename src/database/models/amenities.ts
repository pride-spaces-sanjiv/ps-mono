import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";
import { Conn } from "../mongoose.js";
import { indexFieldsFromSchema } from "@/utils/mongoose/indexing.js";

// --- Amenities Schema ---
const AmenitiesSchema = new Conn.Schema(
  {
    name: {
      type: String,
      required: true,
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
export const Amenities = Conn.model("Amenities", AmenitiesSchema, "amenities");
indexFieldsFromSchema(AmenitiesSchema, { singleFields: ["name", "category"] });
Amenities.syncIndexes();

// Field Names
export const amenitiesFields = getFieldsOfModel(Amenities, {
  timestamps: false,
});
export const allAmenitiesFieldsEnabled = appendGeneralFields(amenitiesFields);
