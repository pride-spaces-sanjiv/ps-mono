import { Space } from "@/database/models/space.js";
import { isObjectIdOrHexString } from "mongoose";
import { spaceSlugMQ, SpaceSlugMQ } from "./rabbitmq.js";
import { sleep } from "@pride-spaces/common/utils/time.js";
import { pipelineDBs } from "../pipeline/db.js";

const handler = async (data: SpaceSlugMQ) => {
  try {
    if (!data?.id) {
      throw new Error("Space ID is required");
    }
    if (!isObjectIdOrHexString(data.id)) {
      throw new Error("Space ID is invalid");
    }

    // Get data for space
    const spaceData = await pipelineDBs.SPACE.getData({
      filter: { id: data.id },
    });
    if (spaceData) {
      // Get operator data
      const operatorData = await pipelineDBs.OPERATOR.getData({
        filter: { id: spaceData.operator },
      });
      if (operatorData) {
        // Get state code
        const stateData = await pipelineDBs.STATE.getData({
          filter: { name: spaceData.location?.state },
        });
        const stateCode = stateData?.code || "";

        // Count of total spaces existing
        const totalSpaces = await Space.countDocuments({
          operator: spaceData.operator,
        });
        const slug = `${operatorData.slug}-${stateCode}-${String(totalSpaces + 1).padStart(4, "0")}`;
        const updatedSpace = await pipelineDBs.SPACE.updateData({
          filter: { id: data.id },
          updateData: { slug },
        });
        return true;
      }
      throw new Error("No operator found");
    }
    throw new Error("No space found");
  } catch (err) {
    console.log("Space Slugs Queue message handler error :", err);
    return false;
  }
};

export const handleSpaceSlugsQueue = async () => {
  await spaceSlugMQ.channel?.prefetch?.(3);
  console.log("Space Slugs Queue handler started");
  spaceSlugMQ.consumeQueue(async (msg) => {
    if (msg) {
      const str = msg.content.toString();
      const data: SpaceSlugMQ = JSON.parse(str);
      console.log("Space Slugs Queue consumed :", data);
      const handled = await handler(data);
      spaceSlugMQ.acknowledgement(handled ? "yes" : "no", msg, false, !handled);
      await sleep(3);
    }
  });
};
