import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";
import { Conn } from "../mongoose.js";
import { indexFieldsFromSchema } from "@/utils/mongoose/indexing.js";
import { placeTypes } from "@pride-spaces/common/utils/data/place.js";
import { GeoLocationSchema } from "./schemas/location.js";

// --- Schema ---
const PlaceSchema = new Conn.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(placeTypes),
      default: "unknown",
      required: true,
    },
    location: {
      type: GeoLocationSchema,
      required: true,
    },
  },
  { timestamps: true },
);

// Model Instances
export const Place = Conn.model("Place", PlaceSchema, "places");
indexFieldsFromSchema(PlaceSchema, {
  singleFields: ["name", "type"],
});
indexFieldsFromSchema(PlaceSchema, {
  singleFields: ["location"],
  value: "2dsphere",
});
indexFieldsFromSchema(PlaceSchema, {
  compoundFields: [["name", "type"]],
});
Place.syncIndexes();

// Field Names
export const placeFields = getFieldsOfModel(Place);
export const allPlaceFieldsEnabled = appendGeneralFields(placeFields);
