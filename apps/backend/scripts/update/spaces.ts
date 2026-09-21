import { ENV } from "@pride-spaces/common/utils/env.js";
ENV;
import { Space } from "@pride-spaces/backend/database/models/space.js";

// Bulk edit
const updateRes = await Space.updateMany(
  {},
  { $set: { files: { images: [], layouts: [] } } },
);
console.log({
  matched: updateRes.matchedCount,
  modified: updateRes.modifiedCount,
});
