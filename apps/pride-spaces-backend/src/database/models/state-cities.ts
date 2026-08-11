import { Conn } from "@/database/mongoose.js";
import {
  getFieldsOfModel,
  appendGeneralFields,
} from "@/utils/mongoose/fields.js";
import { indexFieldsFromSchema } from "@/utils/mongoose/indexing.js";

const StateSchema = new Conn.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);
indexFieldsFromSchema(StateSchema, {
  singleFields: ["name"],
});

const CitySchema = new Conn.Schema(
  {
    rId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    areas: { type: [String], required: true, default: [] },
    lat: { type: Number },
    lng: { type: Number },
    state: { type: String },
  },
  { _id: false },
);
indexFieldsFromSchema(CitySchema, {
  singleFields: ["name", "state", "areas"],
});

// Cache Plugin

// Model Instances
export const State = Conn.model("State", StateSchema, "states");
export const City = Conn.model("City", CitySchema, "cities");

// Field names
export const stateFields = getFieldsOfModel(State, {
  timestamps: false,
});
export const allStateFieldsEnabled = appendGeneralFields(stateFields);
export const cityFields = getFieldsOfModel(City, {
  timestamps: false,
});
export const allCityFieldsEnabled = appendGeneralFields(cityFields);
