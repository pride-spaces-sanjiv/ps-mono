import { Conn } from "@/database/mongoose.js";
import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";

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
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    location: { type: LocationSchema, required: true },
    description: { type: String },
    openTime: { type: NativeDate },
    closeTime: { type: NativeDate },
    openDays: { type: Number },
    isVerified: { type: Boolean },
    isActive: { type: Boolean },
    rating: { type: Number },
    reviews: { type: Number },
  },
  { timestamps: true },
);
SpaceSchema.index({ name: 1, email: 1, branch: 1 });

// Model Instances
export const Space = Conn.model("Space", SpaceSchema, "spaces");

// Field names
export const spaceFields = getFieldsOfModel(Space, {
  timestamps: false,
});
export const allSpaceFieldsEnabled = appendGeneralFields(spaceFields);
