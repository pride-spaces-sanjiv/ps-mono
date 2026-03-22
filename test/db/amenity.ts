import { loadEnv } from "../../src/utils/env";
console.log(process.cwd(), process.env);
// @ts-ignore
const env = loadEnv({ path: "./.env.dev", override: true }).parsed;
import z from "zod";
import {
  amenitySchema,
  type AmenitySchema,
} from "../../src/database/schemas/amenities";
import { Amenity } from "../../src/database/models/amenities";
import { encodeCrypto } from "../../src/utils/crypto";
import { Model, MongooseError } from "mongoose";
const { default: amenities } = await import("../../data/amenities.json", {
  assert: { type: "json" },
});

const dropColl = async <M extends Model<any>>(model: M) => {
  try {
    await model.deleteMany();
  } catch (err) {
    console.error("Error dropping collection:", err);
  }
};

const testSave = async <T extends Record<string, any>, M extends Model<any>>(
  data: T,
  model: M,
) => {
  try {
    const parsed = amenitySchema.parse(data);
    const doc = new model(parsed);
    await doc.save();
    console.log("Saved", parsed.name, parsed.icon);
    return true;
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      console.error("Zod Error validating amenity data:", err);
      return false;
    }
    if (err instanceof MongooseError) {
      console.error("Mongoose Error validating amenity data:", err);
      return false;
    }
    console.error("Unexpected error:", err);
    return false;
  }
};

// await dropColl(Amenity);
let savedCount = 0;
for (const amenity of amenities) {
  const done = await testSave(amenity, Amenity);
  if (done) {
    savedCount += 1;
  }
}
console.log("Total saved :", savedCount, "/", amenities.length);
