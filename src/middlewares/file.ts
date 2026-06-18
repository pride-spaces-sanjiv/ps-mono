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

export const allowedExtensions = {
  image: ["jpg", "jpeg", "png", "gif"],
  layout: ["pdf"],
};

export const tempDir = path.resolve(process.cwd(), "./tmp");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, tempDir);
  },
  filename(req, file, cb) {
    const { fileType = mediaTypes.IMAGE } = req.res?.locals || {};
    const ext = path.extname(file.originalname).toLowerCase();
    cb(
      null,
      `${fileType?.trim() || ""}s/${v7()}${ext}`.replace(/^s\//, "unknown"),
    );
  },
});

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
        storage,
        fileFilter(req, file, cb) {
          const ext = path.extname(file.originalname).toLowerCase();

          if (!allowedExtensions[fileType]?.includes(ext)) {
            return cb(new MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
          }

          cb(null, true);
        },
        ...uploadOptions,
        limits: {
          files: fileType === "image" ? 5 : 3,
          fileSize: fileType === "image" ? 4 * 1024 * 1024 : 10 * 1024 * 1024,
          ...uploadOptions?.limits,
        },
      } as multer.Options;
      res.locals = { ...res.locals, fileType: fileType };
      const upload = multer(totalOpts);

      // Handle multer err if any customly
      return upload.any()(req, res, (err: Error | MulterError | string) => {
        if (err instanceof multer.MulterError) {
          const code = err.code;
          const errorData = multerErrorMapping[code];
          const files = (Array.isArray(req.files) ? req.files : []).map((dt) =>
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
          if (errorData) {
            return ResponseHandler.handleError(res, {
              errorType: errorData.errorType,
              message: errorData.message,
              data: {
                files,
              },
            });
          }

          ResponseHandler.handleError(res, {
            errorType: `file-parser-error-invalid`,
            message: `Invalid file parser error occurred`,
          });
          return;
        }
        if (err instanceof Error) {
          ResponseHandler.handleError(res, {
            errorType: `file-parser-error-unknown`,
            message: `Unexpected file parser error occurred`,
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
