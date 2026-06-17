import { ResponseHandler } from "@/middlewares/request.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { MediaType, mediaTypes } from "@/utils/data/media.js";
import path from "path";
import fs from "fs";
import { allowedExtensions, tempDir } from "@/middlewares/file.js";

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
    const dirStats = fs.readdirSync(tempDir, {
      withFileTypes: true,
      encoding: "utf8",
    });
    const files = dirStats
      .filter(
        (dirent) =>
          dirent.isFile() &&
          allowedExtensions[fileType].includes(path.extname(dirent.name)),
      )
      .map((file) => {
        const filePath = path.join(tempDir, file.name);
        const stats = fs.statSync(filePath);

        return {
          name: file.name,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
        };
      });
    if (files.length === 0) {
      return ResponseHandler.handleNotFound(res, {
        errorType: notFoundOptions?.errorType || "file-not-found",
        message: notFoundOptions?.message || "File not found",
      });
    }
    ResponseHandler.handleSuccess(res, {
      message: successOptions?.message || "File retrieved successfully",
      data: { files },
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
