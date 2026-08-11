import { Conn } from "@/database/mongoose.js";

export const LocationSchema = new Conn.Schema(
  {
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    area: { type: String },
    postalCode: { type: String },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    url: { type: String },
  },
  { _id: false },
);
