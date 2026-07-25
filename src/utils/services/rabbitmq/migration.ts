import {
  extractCSV,
  parseBulkSpacesData,
  pushBulkSpacesData,
} from "@/utils/scripts/bulk/space.js";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { WaitingMigrationMQ, waitingMigrationMQ } from "./rabbitmq.js";
import { sleep } from "@/utils/time.js";
import { rustfsClient } from "../s3/instance.js";
import { getFullMigrationS3Key } from "@/utils/data/s3/keys.js";
import { Readable } from "stream";
import path from "path";
import { getDestinationFolder } from "@/utils/data/file.js";
import { mediaTypes } from "@/utils/data/media.js";
import { pipelineDBs } from "../pipeline/db.js";
import { listS3Objects } from "../s3/list-objects.js";

const spacesHandler = async (data: WaitingMigrationMQ) => {
  try {
    const key = getFullMigrationS3Key(data.fileId, "json");
    const { Body } = await rustfsClient.send(
      new GetObjectCommand({
        Bucket: "pridespaces",
        Key: path.join(
          getDestinationFolder(mediaTypes.MIGRATIONPART),
          `${data.fileId}.json`,
        ),
      }),
    );
    const bodyString = await Body?.transformToString();
    if (!bodyString) {
      throw new Error("Empty body");
    }

    const rows = JSON.parse(bodyString);
    // const rows = await extractCSV(Body as Readable);
    const parsed = await parseBulkSpacesData(rows);
    if (!parsed || parsed.length === 0) {
      throw new Error("No valid data to process");
    }

    const stats = await pushBulkSpacesData(parsed as any[]);
    console.log("Migration part process completion stats :", data, stats);

    const updatedDoc = await pipelineDBs.MIGRATION.updateData({
      filter: { fileId: data.fileId.replace(/\_.*$/, "") },
      updateData: {
        $inc: {
          "stats.processed": parsed.length,
          "stats.success": stats?.success || 0,
          "stats.failed": stats?.failed || 0,
        },
      },
      options: {
        new: true,
      },
    });

    // Try deleting files if all processed
    if (updatedDoc && updatedDoc.stats.total === updatedDoc.stats.processed) {
      const migrationFileId = data.fileId.replace(/\_.*$/, "");

      // Delete main csv
      rustfsClient
        .send(
          new HeadObjectCommand({
            Bucket: "pridespaces",
            Key: `${migrationFileId}.csv`,
          }),
        )
        .then((res) => {
          rustfsClient.send(
            new DeleteObjectCommand({
              Bucket: "pridespaces",
              Key: `${migrationFileId}.csv`,
            }),
          );
        });

      // Delete record parts
      listS3Objects({
        Prefix: path.join(
          getDestinationFolder(mediaTypes.MIGRATIONPART),
          `${migrationFileId}-`,
        ),
      }).then((parts) => {
        parts.forEach((part) => {
          rustfsClient.send(
            new DeleteObjectCommand({
              Bucket: "pridespaces",
              Key: part.Key,
            }),
          );
        });
      });
    }
    return true;
  } catch (err) {
    console.error("Error handling space migration data :", err);
    return false;
  }
};

const handler = async (data: WaitingMigrationMQ) => {
  try {
    const collection = data.collection;
    if (collection === "spaces") {
      return await spacesHandler(data);
    }
    throw new Error("Invalid collection");
  } catch (err) {
    console.log("Migrations Queue message handler error :", err);
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
      waitingMigrationMQ.acknowledgement(
        handled ? "yes" : "no",
        msg,
        false,
        !handled,
      );
      await sleep(3);
    }
  });
};
