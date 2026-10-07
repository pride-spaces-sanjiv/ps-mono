import cron from "node-cron";
import { MediaTemp } from "@/database/models/media.js";
import { rustfsClient } from "@/utils/services/s3/instance.js";
import {
  DeleteObjectsCommand,
  HeadBucketCommand,
  ListObjectsCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { mediaStatuses } from "@pride-spaces/common/utils/data/media.js";

// Delete files that have been deleted or uploaded temporarily.
// Max 100 files can be deleted at a single process
export const deleteMediaRecordsScheduler = cron.schedule(
  "*/10 * * * *",
  async () => {
    try {
      const now = new Date();
      const mediaDocs = await MediaTemp.find({
        expectedDeletion: { $lte: now },
        status: {
          $in: [mediaStatuses.UPLOAD, mediaStatuses.REMOVE],
        },
      }).limit(100);
      const filePaths = mediaDocs.map((doc) => ({
        Key: `${doc.mediaType}s/${doc.fileId}`,
        id: doc.id,
        fileId: doc.fileId,
      }));

      // S3 deletion
      const deletedObjectKeys = new Set<string>();
      try {
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: "pridespaces",
          Delete: {
            Objects: filePaths.map((obj) => ({ Key: obj.Key })),
          },
        });
        const deleteResult = await rustfsClient.send(deleteCommand);
        console.log("Deleted meta :", deleteResult.$metadata);
        console.log("Deleted stats :", {
          success: deleteResult.Deleted?.length || 0,
          errored: deleteResult.Errors?.length || 0,
        });

        // Filter deleted files doc ids
        deleteResult.Deleted?.map((d) => {
          d.Key && deletedObjectKeys.add(d.Key);
        });
      } catch (err) {
        console.error(
          "Error occurred while deleting media files from S3:",
          err,
        );
        throw err;
        if (err instanceof S3ServiceException) {
        }
      }

      const deletedDocs = filePaths.filter((obj) =>
        deletedObjectKeys.has(obj.Key),
      );

      // Delete records in DB
      await MediaTemp.deleteMany({
        _id: { $in: deletedDocs.map((doc) => doc.id) },
      });
    } catch (err) {
      console.error("Error media record deletion cron :", err);
    }
  },
);
