import { Conn } from "@/database/mongoose.js";
import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";
import { indexFieldsFromSchema } from "@/utils/mongoose/indexing.js";

const LocationSchema = new Conn.Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);

const SpaceSchema = new Conn.Schema(
  {
    branch: { type: String, required: true },
    operator: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    location: { type: LocationSchema, required: true },
    description: { type: String },
    openTime: { type: Date },
    closeTime: { type: Date },
    openDays: { type: Number },
    isVerified: { type: Boolean },
    isActive: { type: Boolean },
    rating: { type: Number },
    reviews: { type: Number },
  },
  { timestamps: true },
);
indexFieldsFromSchema(SpaceSchema, {
  singleFields: ["branch", "operator", "name"],
});

// Model Instances
export const Space = Conn.model("Space", SpaceSchema, "spaces");

// Field names
export const spaceFields = getFieldsOfModel(Space, {
  timestamps: false,
});
export const allSpaceFieldsEnabled = appendGeneralFields(spaceFields);
