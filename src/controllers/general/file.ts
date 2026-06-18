import { ResponseHandler } from "@/middlewares/request.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { MediaType, mediaTypes } from "@/utils/data/media.js";
import path from "path";
import fs from "fs";
import { allowedExtensions, tempDir } from "@/middlewares/file.js";
import { rustfsClient } from "@/utils/services/s3/instance.js";
import {
  HeadObjectCommand,
  ListObjectsV2Command,
  ErrorDetails,
} from "@aws-sdk/client-s3";
import { pickObjectFields } from "@/utils/object/clean.js";
import { MediaQuerySchema } from "@/database/schemas/media.js";

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
  } catch (err) {
    console.error("Error getting file : ", { fileType }, err);
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
