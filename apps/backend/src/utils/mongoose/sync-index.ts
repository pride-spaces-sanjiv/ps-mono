import { User, Admin } from "@/database/models/user.js";
import { Operator } from "@/database/models/operator.js";
import { Space } from "@/database/models/space.js";
import { Builder } from "@/database/models/builder.js";
import { ConventionalProperty } from "@/database/models/conventional.js";
import { Amenity } from "@/database/models/amenities.js";
import { Dump } from "@/database/models/dump.js";

const models = [
  User,
  Admin,
  Operator,
  Space,
  Builder,
  ConventionalProperty,
  Amenity,
  Dump,
];

export const syncAllIndexes = async () => {
  for (const model of models) {
    try {
      await model.syncIndexes();
    } catch (err) {
      console.error(
        `Error occurred while syncing indexes for model ${model.modelName}:`,
        err,
      );
    }
  }
};
