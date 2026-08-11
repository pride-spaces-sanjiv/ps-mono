import { areasUpdateMQ, AreasUpdateMQ } from "./rabbitmq.js";
import { sleep } from "@/utils/time.js";
import { City } from "@/database/models/state-cities.js";

const handler = async (data: AreasUpdateMQ) => {
  try {
    const pairs = data?.pairs.filter(
      (dt) => dt.city?.trim() && dt.area?.trim(),
    );

    // Insert only new areas
    const bulkRes = await City.bulkWrite(
      pairs.map((p) => ({
        updateOne: {
          filter: { name: p.city.trim() },
          update: { $addToSet: { areas: p.area.trim() } },
        },
      })),
      { ordered: false },
    );
    console.log("Bulk area update stats :", {
      added: bulkRes.insertedCount,
      updated: bulkRes.modifiedCount,
      matched: bulkRes.modifiedCount,
      upserted: bulkRes.upsertedCount,
      failed: bulkRes.getWriteErrorCount(),
    });
    // existing.map((doc) => {
    //   const newAreas = pairs
    //     .filter((p) => p.city.trim() === doc.name.trim())
    //     .map((p) => p.area.trim())
    //     .filter((area) => !doc.areas.includes(area));
    //   const data = {
    //     id: doc.id,
    //     _id: doc._id,
    //     name: doc.name,
    //     areas: newAreas,
    //   };
    // });
    return true;
  } catch (err) {
    console.log("Areas Updates Queue message handler error :", err);
    return false;
  }
};

export const handleAreasUpdateQueue = async () => {
  await areasUpdateMQ.channel?.prefetch?.(5);
  console.log("Areas Updates Queue handler started");
  areasUpdateMQ.consumeQueue(async (msg) => {
    if (msg) {
      const str = msg.content.toString();
      const data: AreasUpdateMQ = JSON.parse(str);
      console.log("Areas Updates Queue consumed :", data);
      const handled = await handler(data);
      areasUpdateMQ.acknowledgement(
        handled ? "yes" : "no",
        msg,
        false,
        !handled,
      );
      await sleep(2);
    }
  });
};
