import { ResponseHandler } from "@/middlewares/request.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { MediaType, mediaTypes } from "@/utils/data/media.js";
import path from "path";
import fs from "fs";
import { allowedExtensions } from "@/utils/data/media.js";
import { tempDir } from "@/middlewares/file.js";
import { rustfsClient } from "@/utils/services/s3/instance.js";
import {
  HeadObjectCommand,
  ListObjectsV2Command,
  ErrorDetails,
  ErrorDetails$,
  S3ServiceException,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { pickObjectFields } from "@/utils/object/clean.js";
import { MediaQuerySchema } from "@/database/schemas/media.js";
import { newQueue } from "@henrygd/queue/rl";
import * as spaceMigrationUtils from "@/utils/scripts/bulk/space.js";
import { Readable } from "stream";
import { pipelineDBs } from "@/utils/services/pipeline/db.js";
import { Upload } from "@aws-sdk/lib-storage";
import { getDestinationFolder } from "@/utils/data/file.js";
import { RowData } from "@/utils/scripts/data/space-headers.js";
import { waitingMigrationMQ } from "@/utils/services/rabbitmq/rabbitmq.js";

const getFile = async (
  req: ManagedRequest<any, MediaQuerySchema>,
  res: ManagedResponse,
  options: Partial<
    Record<
      "error" | "notFound" | "success",
      Partial<{ errorType: string; message: string }>
    > & { fileType: MediaType }
  > = {},
) => {
  const {
    error: errorOptions,
    notFound: notFoundOptions,
    success: successOptions,
    fileType = mediaTypes.IMAGE,
  } = options;
  try {
    const fileName = `${req.query.id}.${req.query.ext}`;
    const destination = `${fileType?.trim() || ""}s/`.replace(
      /^s\//,
      "unknown/",
    );
    const key = path.join(destination, fileName);
    const existsRes = await rustfsClient.send(
      new HeadObjectCommand({
        Bucket: "pridespaces",
        Key: key,
      }),
    );
    // existsRes.

    if (existsRes.$metadata.httpStatusCode === 404) {
      return ResponseHandler.handleNotFound(res, {
        errorType: notFoundOptions?.errorType || "file-not-found",
        message: notFoundOptions?.message || "File not found",
      });
    }
    ResponseHandler.handleSuccess(res, {
      message: successOptions?.message || "File retrieved successfully",
      data: {
        bucket: "pridespaces",
        file: {
          path: key,
          destination: destination,
          fileName: fileName,
          mimeType: existsRes.ContentType,
          size: existsRes.ContentLength,
          lastModified: existsRes.LastModified,
          encoding: existsRes.ContentEncoding,
        },
      },
    });
  } catch (err: any) {
    console.error("Error getting file : ", { fileType }, err);

    // Handle s3 error
    if (err instanceof S3ServiceException) {
      if (
        err.$metadata.httpStatusCode === 404 ||
        err.name === "NoSuchKey" ||
        err.name === "NotFound"
      ) {
        return ResponseHandler.handleNotFound(res, {
          errorType: notFoundOptions?.errorType || "file-not-found",
          message: notFoundOptions?.message || "File not found",
          data: {
            error: {
              name: err.name,
              status: err.$metadata.httpStatusCode,
              cause: err.cause,
              fault: err.$fault,
              // message: err.message,
            },
          },
        });
      }
    }

    ResponseHandler.handleError(res, {
      errorType: errorOptions?.errorType || "get-file-error-failure",
      message: errorOptions?.message || "Failed to get file",
    });
  }
};

const getUploadedFiles = async (
  req: ManagedRequest<any>,
  res: ManagedResponse,
  options: Partial<
    Record<
      "error" | "notFound" | "success",
      Partial<{ errorType: string; message: string }>
    > & { fileType: MediaType }
  > = {},
) => {
  const {
    error: errorOptions,
    notFound: notFoundOptions,
    success: successOptions,
    fileType = mediaTypes.IMAGE,
  } = options;
  try {
    const parserFiles = Array.isArray(req.files) ? req.files : [];
    const parserFileNames = parserFiles.map((f) => f.filename);
    const files = parserFiles.map((file) =>
      pickObjectFields(file, {
        includeFields: [
          "filename",
          "fieldname",
          "destination",
          "path",
          "mimetype",
          "originalname",
          "size",
        ],
      }),
    );
    if (files.length === 0) {
      return ResponseHandler.handleNotFound(res, {
        errorType: notFoundOptions?.errorType || "files-not-uploaded",
        message: notFoundOptions?.message || "No files were uploaded",
      });
    }
    ResponseHandler.handleSuccess(res, {
      status: 201,
      message: successOptions?.message || "Files uploaded successfully",
      data: { files, bucket: "pridespaces" },
    });
    return files;
  } catch (err) {
    console.error("Error getting uploaded files : ", { fileType }, err);
    ResponseHandler.handleError(res, {
      errorType: errorOptions?.errorType || "upload-files-error-failure",
      message: errorOptions?.message || "Failed to upload files",
    });
  }
};

//

export const getImageFile = async (
  req: ManagedRequest<any, MediaQuerySchema>,
  res: ManagedResponse,
) => {
  try {
    await getFile(req, res, {
      fileType: mediaTypes.IMAGE,
      error: {
        errorType: "get-image-file-error-failure",
        message: "Failed to get image file",
      },
      notFound: {
        errorType: "image-file-not-found",
        message: "Image file not found",
      },
      success: {
        message: "Image file retrieved successfully",
      },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-image-file-error-failure",
      message: "Failed to get image file",
    });
  }
};

export const getLayoutFile = async (
  req: ManagedRequest<any, MediaQuerySchema>,
  res: ManagedResponse,
) => {
  try {
    await getFile(req, res, {
      fileType: mediaTypes.LAYOUT,
      error: {
        errorType: "get-layout-file-error-failure",
        message: "Failed to get layout file",
      },
      notFound: {
        errorType: "layout-file-not-found",
        message: "Layout file not found",
      },
      success: {
        message: "Layout file retrieved successfully",
      },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-layout-file-error-failure",
      message: "Failed to get layout file",
    });
  }
};

export const uploadImageFiles = async (
  req: ManagedRequest<any>,
  res: ManagedResponse,
) => {
  try {
    await getUploadedFiles(req, res, {
      fileType: mediaTypes.IMAGE,
      error: {
        errorType: "upload-images-error-failure",
        message: "Failed to upload image files",
      },
      notFound: {
        errorType: "images-not-uploaded",
        message: "No image files were uploaded",
      },
      success: {
        message: "Image files uploaded successfully",
      },
    });
  } catch (err: any) {
    ResponseHandler.handleError(res, {
      errorType: "upload-images-error-failure",
      message: "Failed to upload image files",
    });
  }
};

export const uploadLayoutFiles = async (
  req: ManagedRequest<any>,
  res: ManagedResponse,
) => {
  try {
    await getUploadedFiles(req, res, {
      fileType: mediaTypes.LAYOUT,
      error: {
        errorType: "upload-layouts-error-failure",
        message: "Failed to upload layout files",
      },
      notFound: {
        errorType: "layouts-not-uploaded",
        message: "No layout files were uploaded",
      },
      success: {
        message: "Layout files uploaded successfully",
      },
    });
  } catch (err: any) {
    ResponseHandler.handleError(res, {
      errorType: "upload-layouts-error-failure",
      message: "Failed to upload layout files",
    });
  }
};

// Migration
const migrationPostProcessQueue = newQueue(3, 2, 2000);

const postMigrationUpload = async (
  file: Pick<
    Express.Multer.File,
    | "filename"
    | "fieldname"
    | "destination"
    | "path"
    | "mimetype"
    | "originalname"
    | "size"
  >,
) => {
  try {
    const fileId = file.filename.replace(/\..*$/, "");

    // Get stream of s3 file
    const { Body } = await rustfsClient.send(
      new GetObjectCommand({
        Bucket: "pridespaces",
        Key: file.path,
      }),
    );

    if (!Body) throw new Error("No file or Empty file");

    const rows = await spaceMigrationUtils.extractCSV(Body as Readable);

    // Save initate data to DB
    await pipelineDBs.MIGRATION.createData({
      data: {
        collection: "spaces",
        fileId: fileId,
        stats: {
          total: rows.length,
          processed: 0,
          success: 0,
          failed: 0,
          parts: 0,
          uploadedParts: 0,
        },
      },
    });

    // Upload parts to s3
    // Parts creation of each max 100 rows
    const parts = rows.reduce((prev, curr, i) => {
      if (i % 100 === 0) {
        prev.push([]);
      }
      prev[prev.length - 1].push(curr);
      return prev;
    }, [] as RowData[][]);
    await pipelineDBs.MIGRATION.updateData({
      filter: { fileId: fileId },
      updateData: {
        $set: { "stats.parts": parts.length },
      },
    });

    // Part upload
    parts.forEach((rows, i) => {
      migrationPostProcessQueue.add(async () => {
        const str = JSON.stringify(rows);
        const partFileId = `${fileId}_${i + 1}`;
        const upload = new Upload({
          client: rustfsClient,
          params: {
            Bucket: "pridespaces",
            Key: path.join(
              getDestinationFolder(mediaTypes.MIGRATIONPART),
              `${partFileId}.json`,
            ),
            Body: str,
            ContentType: "application/json",
          },
        });

        // Upload each part, update stats and send message to MQ
        upload
          .done()
          .then(async (data) => {
            await pipelineDBs.MIGRATION.updateData({
              filter: { fileId: fileId },
              updateData: {
                $inc: { "stats.uploadedParts": 1 },
              },
            });
            waitingMigrationMQ.sendMessage({
              collection: "spaces",
              fileId: partFileId,
            });
          })
          .catch((err) => {
            console.error(
              "Failed uploading part",
              {
                fileId,
                partFileId,
                part: i + 1,
                totalParts: parts.length,
              },
              err,
            );
          });
      });
    });
  } catch (err) {
    console.error("Error caused during post migration process :", err);
  }
};

export const uploadMigrationFile = async (
  req: ManagedRequest<any>,
  res: ManagedResponse,
) => {
  try {
    const files = await getUploadedFiles(req, res, {
      fileType: mediaTypes.MIGRATIONFILE,
      error: {
        errorType: "upload-migration-file-error-failure",
        message: "Failed to upload migration file",
      },
      notFound: {
        errorType: "migration-files-not-uploaded",
        message: "No migration files were uploaded",
      },
      success: {
        message: "Migration file uploaded successfully",
      },
    });

    // Post migration process
    if (files) {
      const file = files[0];
      setTimeout(() => {
        postMigrationUpload(file);
      }, 500);
    }
  } catch (err: any) {
    ResponseHandler.handleError(res, {
      errorType: "upload-migration-file-error-failure",
      message: "Failed to upload migration file",
    });
  }
};
