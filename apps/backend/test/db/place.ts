import { ENV } from "@pride-spaces/common/utils/env.js";
ENV;
// console.log(ENV);

import { Place } from "@pride-spaces/backend/database/models/place.js";
import { ModelToRaw } from "@pride-spaces/backend/types/mongoose/document.js";
import {
  placeTypes,
  PlaceType,
} from "@pride-spaces/common/utils/data/place.js";
import { DefaultTimestampProps } from "mongoose";
import moment from "moment";

const { default: airports } =
  await import("../../data/places/bengaluru/airports.json");
const { default: metros } =
  await import("../../data/places/bengaluru/metro-stations.json");
const { default: railways } =
  await import("../../data/places/bengaluru/railway-stations.json");
const { default: buses } =
  await import("../../data/places/bengaluru/bus-stations.json");

const createPlace = async (
  data: Omit<
    ModelToRaw<typeof Place>,
    keyof DefaultTimestampProps | "id" | "_id"
  >,
) => {
  const doc = new Place(data);
  await doc.save();
  return doc;
};

await Place.collection.drop();
const places = [...airports, ...metros, ...railways, ...buses];

for (let i = 0; i < places.length; i++) {
  const place = places[i] as Omit<
    ModelToRaw<typeof Place>,
    keyof DefaultTimestampProps | "id" | "_id"
  >;
  const placeDoc = await createPlace(place);
  console.log(placeDoc);
}
