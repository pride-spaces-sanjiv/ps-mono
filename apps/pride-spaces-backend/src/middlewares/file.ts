import path from "path";
import multer, { MulterError, ErrorCode } from "multer";
import { v7 } from "uuid";
import { ResponseHandler } from "./request.js";
import { multerErrorMapping } from "@/utils/data/multer.js";
import { pickObjectFields } from "@/utils/object/clean.js";
import { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { NextFunction } from "express";
import { MediaType, mediaTypes } from "@/utils/data/media.js";
import { existsSync, mkdirSync } from "fs";
import { S3StorageEngine } from "@/utils/services/s3/instance.js";
import { allowedExtensions } from "@/utils/data/media.js";

export const tempDir = path.resolve(process.cwd(), "./tmp");

const storageEngine = new S3StorageEngine({ bucketName: "pridespaces" });
// const storage = multer.diskStorage({
//   destination(req, file, cb) {
//     cb(null, tempDir);
//   },
//   filename(req, file, cb) {
//     const { fileType = mediaTypes.IMAGE } = req.res?.locals || {};
//     const ext = path.extname(file.originalname).toLowerCase();
//     cb(
//       null,
//       `${fileType?.trim() || ""}s/${v7()}${ext}`.replace(/^s\//, "unknown"),
//     );
//   },
// });

export const createTempDir = () => {
  try {
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
      return true;
    }
    return existsSync(tempDir);
  } catch (err) {
    console.error("Errror creating temp dir :", err);
    return false;
  }
};

const multerFileFilter =
  (fileType: MediaType): multer.Options["fileFilter"] =>
  (req, file, cb) => {
    const ext = path
      .extname(file.originalname)
      .toLowerCase()
      .replace(/^\.+/g, "");

    if (!allowedExtensions[fileType]?.includes(ext)) {
      console.log("Multer file filter [invalid-file]", { ...file, ext });
      return cb(new MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }

    cb(null, true);
  };

export const validateFileUpload = <K extends string>(
  options: Partial<{
    fileType: MediaType;
    errorKey: string;
    errorMsgKey: string;
    uploadOptions: multer.Options;
  }> = {},
) => {
  const handler = async (
    req: ManagedRequest<Record<string, any> & Record<K, any>>,
    res: ManagedResponse,
    next: NextFunction,
  ) => {
    const {
      fileType = "image",
      uploadOptions = {},
      errorKey = "upload",
      errorMsgKey = "upload file",
    } = options;
    try {
      const totalOpts = {
        storage: storageEngine,
        fileFilter: multerFileFilter(fileType),
        ...uploadOptions,
        limits: {
          files:
            fileType === "image" ? 5 : fileType === "migrationfile" ? 1 : 3,
          fileSize:
            fileType === "image"
              ? 4 * 1024 * 1024
              : fileType === "migrationfile"
                ? 50 * 1024 * 1024
                : 10 * 1024 * 1024,
          ...uploadOptions?.limits,
        },
      } as multer.Options;
      res.locals = { ...res.locals, fileType: fileType };
      const upload = multer(totalOpts);

      // Handle multer err if any customly
      return upload.any()(req, res, (err: Error | MulterError | string) => {
        err && console.error("Multer upload error:", err);

        const files = (
          Array.isArray(req.files)
            ? req.files
            : typeof req.files === "object"
              ? Object.values(req.files).flatMap((f) => f)
              : []
        ).map((dt) =>
          pickObjectFields(dt, {
            includeFields: [
              "fieldname",
              "originalname",
              "filename",
              "encoding",
              "mimetype",
              "size",
            ],
          }),
        );
        if (err instanceof multer.MulterError) {
          const code = err.code;
          const errorData = multerErrorMapping[code];

          if (errorData) {
            return ResponseHandler.handleError(res, {
              errorType: errorData.errorType,
              message: errorData.message,
              data: {
                files,
                body: req.body,
              },
            });
          }

          ResponseHandler.handleError(res, {
            errorType: `file-parser-error-invalid`,
            message: `Invalid file parser error occurred`,
            data: {
              files,
              body: req.body,
              error: {
                code: err.code,
                name: err.name,
                message: err.message,
                cause: err.cause,
                field: err.field,
              },
            },
          });
          return;
        }
        if (err instanceof Error) {
          ResponseHandler.handleError(res, {
            errorType: `file-parser-error-unknown`,
            message: `Unexpected file parser error occurred`,
            data: {
              files: files,
              body: req.body,
            },
          });
          return;
        }
        next?.();
      });
    } catch (err) {
      ResponseHandler.handleError(res, {
        errorType: `file-parser-error`,
        message: `Failed to parse files`,
      });
    }
  };
  return handler;
};
