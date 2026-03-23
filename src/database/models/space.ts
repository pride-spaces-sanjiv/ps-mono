import { Conn } from "@/database/mongoose.js";
import { ApprovalSchema } from "./dump.js";
import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";
import { indexFieldsFromSchema } from "@/utils/mongoose/indexing.js";
import { spaceTypes, spaceGrades } from "@/utils/data/spaceTypes.js";
import { workingSizes } from "@/utils/data/workingSizes.js";

const PersonSchema = new Conn.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    contactNo: { type: String, required: true },
    role: { type: String, required: true },
  },
  { _id: false },
);

const LocationSchema = new Conn.Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    area: { type: String, required: true },
    postalCode: { type: String },
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
    email: { type: String, required: true },
    location: { type: LocationSchema, required: true },
    person: { type: PersonSchema, required: true },
    slug: { type: String, required: true, unique: true },
    area: { type: Number },
    description: { type: String },
    category: { type: String, default: "Classic" },
    spaceType: { type: String, enum: spaceTypes, default: "Flex" },
    grade: { type: String, enum: spaceGrades, default: "B" },
    openTime: { type: Date },
    closeTime: { type: Date },
    openDays: { type: [Number] },
    operationalHrs: { type: Number },
    facilities: { type: [String] },
    workingSizes: { type: [{ type: String, enum: workingSizes }], default: [] },
    isVerified: { type: Boolean },
    isActive: { type: Boolean },
    totalSeats: { type: Number, default: 0 },
    bookedSeats: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    rating: { type: Number },
    reviews: { type: Number },
    approval: { type: ApprovalSchema },
  },
  { timestamps: true },
);
indexFieldsFromSchema(SpaceSchema, {
  singleFields: [
    "branch",
    "operator",
    "name",
    "email",
    "location.city",
    "location.country",
    "location.state",
    "location.area",
    "person.name",
    "person.email",
  ],
});

// Model Instances
export const Space = Conn.model("Space", SpaceSchema, "spaces");
Space.syncIndexes();

// Field names
export const spaceFields = getFieldsOfModel(Space, {
  timestamps: false,
});
export const allSpaceFieldsEnabled = appendGeneralFields(spaceFields);
