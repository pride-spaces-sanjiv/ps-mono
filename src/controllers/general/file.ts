import { ResponseHandler } from "@/middlewares/request.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { MediaType, mediaTypes } from "@/utils/data/media.js";
import path from "path";
import fs from "fs";
import { allowedExtensions, tempDir } from "@/middlewares/file.js";
import { rustfsClient } from "@/utils/services/s3/instance.js";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { pickObjectFields } from "@/utils/object/clean.js";

const getFile = async (
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
    const destination = `${fileType?.trim() || ""}s/`.replace(
      /^s\//,
      "unknown/",
    );
    const listRes = await rustfsClient.send(
      new ListObjectsV2Command({
        Bucket: "pridespaces",
        Prefix: destination,
      }),
    );

    const parserFiles = Array.isArray(req.files) ? req.files : [];
    const parserFileNames = parserFiles.map((f) => f.filename);
    // S3 files
    const cloudFiles =
      listRes.Contents?.filter(
        (obj) =>
          (obj.Size ?? 0) > 0 &&
          typeof obj.Key === "string" &&
          parserFileNames.includes(obj.Key as string),
      ).map((obj) => ({
        fileName: obj.Key as string,
        path: path.join(destination, obj.Key as string),
        size: obj.Size as number,
        lastModified: obj.LastModified,
      })) || [];

    const files = parserFiles
      .map((file) =>
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
      )
      .map((file) => ({
        ...file,
        uploadStats:
          cloudFiles.find((f) => file.filename.includes(f.fileName)) || null,
      }));

    // const dirStats = fs.readdirSync(tempDir, {
    //   withFileTypes: true,
    //   encoding: "utf8",
    // });
    // const files = dirStats
    //   .filter(
    //     (dirent) =>
    //       dirent.isFile() &&
    //       allowedExtensions[fileType].includes(path.extname(dirent.name)),
    //   )
    //   .map((file) => {
    //     const filePath = path.join(tempDir, file.name);
    //     const stats = fs.statSync(filePath);

    //     return {
    //       name: file.name,
    //       size: stats.size,
    //       createdAt: stats.birthtime,
    //       modifiedAt: stats.mtime,
    //       isFile: stats.isFile(),
    //       isDirectory: stats.isDirectory(),
    //     };
    //   });
    if (files.length === 0) {
      return ResponseHandler.handleNotFound(res, {
        errorType: notFoundOptions?.errorType || "file-not-found",
        message: notFoundOptions?.message || "File not found",
      });
    }
    ResponseHandler.handleSuccess(res, {
      message: successOptions?.message || "File retrieved successfully",
      data: { files, bucket: "pridespaces" },
    });
  } catch (err) {
    console.error("Error getting file : ", { fileType }, err);
    ResponseHandler.handleError(res, {
      errorType: errorOptions?.errorType || "get-file-error-failure",
      message: errorOptions?.message || "Failed to get file",
    });
  }
};

export const getImageFile = async (
  req: ManagedRequest<any>,
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
  req: ManagedRequest<any>,
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

// export const createImageFile = async (
//   req: ManagedRequest<AmenitySchema>,
//   res: ManagedResponse,
// ) => {
//   try {
//     const body = req.body;

//     const doc = new Amenity(body);
//     await doc.save();

//     const data = convertDataToJSON(doc);

//     ResponseHandler.handleSuccess(res, {
//       status: 201,
//       message: "Created amenity successfully",
//       data,
//     });
//   } catch (err: any) {
//     const errorData = handleMongooseError(err, res, {
//       uniqueError: {
//         errorType: "amenity-unique-error",
//         msgPre: "Amenities",
//       },
//     });

//     if (errorData.handled) return;

//     ResponseHandler.handleError(res, {
//       errorType: "create-amenity-error-failure",
//       message: "Failed to create amenity",
//     });
//   }
// };
