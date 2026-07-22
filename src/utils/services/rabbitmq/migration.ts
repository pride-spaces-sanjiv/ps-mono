import {
  extractCSV,
  parseBulkSpacesData,
  pushBulkSpacesData,
} from "@/utils/scripts/bulk/space.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { WaitingMigrationMQ, waitingMigrationMQ } from "./rabbitmq.js";
import { sleep } from "@/utils/time.js";
import { rustfsClient } from "../s3/instance.js";
import { getFullMigrationS3Key } from "@/utils/data/s3/keys.js";
import { Readable } from "stream";

const spacesHandler = async (data: WaitingMigrationMQ) => {
  try {
    const key = getFullMigrationS3Key(data.fileId, "json");
    const { Body } = await rustfsClient.send(
      new GetObjectCommand({
        Bucket: "pridespaces",
        Key: key,
      }),
    );
    const bodyString = await Body?.transformToString();
    if (!bodyString) {
      throw new Error("Empty body");
    }

    const rows = JSON.parse(bodyString);
    // const rows = await extractCSV(Body as Readable);
    const parsed = await parseBulkSpacesData(rows);
    const stats = await pushBulkSpacesData(parsed as any[]);
  } catch (err) {
    console.error("Error handling space migration data :", err);
    return false;
  }
};

const handler = async (data: WaitingMigrationMQ) => {
  try {
  } catch (err) {
    console.log("Mail data handler failed :", err);
    return false;
  }
};

export const handleMigrationQueue = async () => {
  await waitingMigrationMQ.channel?.prefetch?.(3);
  console.log("Migrations Queue handler started");
  waitingMigrationMQ.consumeQueue(async (msg) => {
    if (msg) {
      const str = msg.content.toString();
      const data: WaitingMigrationMQ = JSON.parse(str);
      console.log("Migrations Queue consumed :", data);
      const handled = await handler(data);
      handled && waitingMigrationMQ.acknowledgement("yes", msg);
      await sleep(3);
    }
  });
};
