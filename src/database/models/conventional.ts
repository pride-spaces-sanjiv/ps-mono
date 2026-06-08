import { Conn } from "@/database/mongoose.js";
import { ApprovalSchema } from "./dump.js";
import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";
import { indexFieldsFromSchema } from "@/utils/mongoose/indexing.js";
import { spaceGrades } from "@/utils/data/spaceTypes.js";
import {
  dealStatuses,
  esgScores,
  furnishStatuses,
  greenCerts,
  occupancyStatuses,
  ownershipTypes,
  sources,
} from "@/utils/data/conventional.js";

const PersonSchema = new Conn.Schema(
  {
    name: { type: String },
    email: { type: String },
    contactNo: { type: String },
    role: { type: String },
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
    landMark: { type: String },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);

const DistanceDiffSchema = new Conn.Schema(
  {
    airport: { type: Number },
    metro: { type: Number },
    cbd: { type: Number },
  },
  { _id: false },
);

export const TotalMetricsSchema = new Conn.Schema(
  {
    floors: { type: Number, default: 0 },
    towers: { type: Number, default: 0 },
  },
  {
    _id: false,
  },
);

export const AreaSchema = new Conn.Schema(
  {
    totalBuiltArea: { type: Number, default: 0 },
    totalLeasedArea: { type: Number, default: 0 },
    floorPlateSize: { type: Number, default: 0 },
    availableArea: { type: Number, default: 0 },
    minDivHeight: { type: Number, default: 0 },
    ceilingHeight: { type: Number, default: 0 },
  },
  {
    _id: false,
  },
);

export const SpecsSchema = new Conn.Schema(
  {
    powerBackup: { type: Number, default: 0 },
    hvacType: { type: String },
    liftCount: { type: Number, default: 0 },
    parkingRatio: { type: [Number], default: [] },
    greenCert: { type: String, enum: greenCerts },
    lockInPeriod: { type: Number, default: 0 },
    leaseTerm: { type: Number, default: 0 },
    ownershipType: { type: String, enum: ownershipTypes },
    occupancyStatus: { type: String, enum: occupancyStatuses },
    furnishStatus: { type: String, enum: furnishStatuses },
    source: { type: String, enum: sources },
    dealStatus: { type: String, enum: dealStatuses },
    esgScore: { type: String, enum: esgScores },
    vacany: { type: Number, default: 0 },
    internetProviders: { type: [String], default: [] },
    nearbyInfras: { type: [String], default: [] },
    tenantMix: { type: String },
    anchorTenants: { type: [String], default: [] },
  },
  {
    _id: false,
  },
);

export const PricingSchema = new Conn.Schema(
  {
    rent: { type: Number, default: 0 },
    camCharge: { type: Number, default: 0 },
    depositMonths: { type: Number, default: 0 },
    escalation: { type: Number, default: 0 },
    parkingCharge: { type: Number, default: 0 },
  },
  {
    _id: false,
  },
);

const ConventionalPropertySchema = new Conn.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    developer: { type: String, required: true },
    type: { type: String, required: true },
    completionYear: { type: Number },
    grade: { type: String, enum: spaceGrades, default: "B" },
    totalMetrics: {
      type: TotalMetricsSchema,
    },
    location: { type: LocationSchema },
    distanceDiffs: { type: DistanceDiffSchema },
    area: { type: AreaSchema },
    specs: { type: SpecsSchema },
    pricing: { type: PricingSchema },
    facilities: { type: [String] },
    person: { type: PersonSchema },
    gstNo: { type: String },
    approval: { type: ApprovalSchema },
    canImmediateAvail: { type: Boolean, default: false },
    isSez: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
indexFieldsFromSchema(ConventionalPropertySchema, {
  singleFields: [
    "name",
    "slug",
    "developer",
    "area.totalBuiltArea",
    "area.totalLeasedArea",
    "pricing.rent",
    "location.city",
    "location.country",
    "location.state",
    "location.area",
    "person.name",
    "person.email",
  ],
});

// Model Instances
export const ConventionalProperty = Conn.model(
  "ConventionalProperty",
  ConventionalPropertySchema,
  "conventional-properties",
);

// Field names
export const conventionalPropertyFields = getFieldsOfModel(
  ConventionalProperty,
  {
    timestamps: false,
  },
);
export const allConventionalPropertyFieldsEnabled = appendGeneralFields(
  conventionalPropertyFields,
);
