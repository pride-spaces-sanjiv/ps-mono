import { Conn } from "@/database/mongoose.js";
import { ApprovalSchema } from "./dump.js";
import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";
import { indexFieldsFromSchema } from "@/utils/mongoose/indexing.js";
import { spaceTypes, spaceGrades } from "@/utils/data/spaceTypes.js";
import { workingSizes } from "@/utils/data/workingSizes.js";
import { FilesSchema } from "./schemas/files.js";
import { LocationSchema } from "./schemas/location.js";
import { spaceCategories } from "@/utils/data/category.js";

const PersonSchema = new Conn.Schema(
  {
    name: { type: String },
    email: { type: String },
    contactNo: { type: String },
    role: { type: String },
  },
  { _id: false },
);

const PricingSchema = new Conn.Schema(
  {
    dayPass: { type: Number },
    perSeat: { type: Number },
    dedicatedDesk: { type: Number },
    flexiDesk: { type: Number },
    privateCabin: { type: Number },
    vo: { type: Number },
  },
  { _id: false },
);

const SpecsSchema = new Conn.Schema(
  {
    category: { type: String, enum: spaceCategories, default: "Starter" },
    spaceType: { type: String, enum: spaceTypes, default: "Flex" },
    grade: { type: String, enum: spaceGrades, default: "B" },
    area: { type: Number },
    workingSizes: { type: [{ type: String, enum: workingSizes }], default: [] },
  },
  { _id: false },
);

const TimingSchema = new Conn.Schema(
  {
    openTime: { type: Date },
    closeTime: { type: Date },
    openDays: { type: [Number] },
    operationalHrs: { type: Number },
    operationalSince: { type: Number },
  },
  { _id: false },
);

const SeatsSchema = new Conn.Schema(
  {
    total: { type: Number, default: 0 },
    booked: { type: Number, default: 0 },
  },
  { _id: false },
);

const FlagsSchema = new Conn.Schema(
  {
    isOc: { type: Boolean, default: false },
    isSez: { type: Boolean, default: false },
    isVerified: { type: Boolean },
    isActive: { type: Boolean },
  },
  { _id: false },
);

const SpaceSchema = new Conn.Schema(
  {
    branch: { type: String },
    operator: { type: String, required: true },
    name: { type: String, required: true },
    fullKeyword: { type: String, required: true },
    email: { type: String },
    location: { type: LocationSchema },
    person: { type: PersonSchema, required: true },
    slug: { type: String, required: true, unique: true },
    specs: { type: SpecsSchema },
    timing: { type: TimingSchema },
    seats: { type: SeatsSchema },
    flags: { type: FlagsSchema },
    description: { type: String },
    facilities: { type: [String] },
    price: { type: Number, default: 0 },
    pricing: { type: PricingSchema, required: true },
    rating: { type: Number },
    reviews: { type: Number },
    files: { type: FilesSchema },
    approval: { type: ApprovalSchema },
  },
  { timestamps: true },
);
indexFieldsFromSchema(SpaceSchema, {
  singleFields: [
    "branch",
    "operator",
    "name",
    "fullKeyword",
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
