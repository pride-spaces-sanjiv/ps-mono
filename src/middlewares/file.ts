import { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { NextFunction } from "express";
import { ResponseHandler } from "./request.js";
import { MediaType } from "@/utils/data/media.js";
import path from "path";
import multer, { MulterError, ErrorCode } from "multer";
import { v7 } from "uuid";
import { Types } from "mongoose";

export const allowedExtensions = {
  image: ["jpg", "jpeg", "png", "gif"],
  layout: ["pdf"],
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.resolve(process.cwd(), "./tmp"));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${v7()}${ext}`);
  },
});

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
          files: 5,
          fileSize: fileType === "image" ? 4 * 1024 * 1024 : 10 * 1024 * 1024,
          ...uploadOptions?.limits,
        },
      } as multer.Options;
      res.locals = { ...res.locals, fileType: fileType };
      const upload = multer(totalOpts);
      return upload.any()(req, res, next);
    } catch (err) {
      ResponseHandler.handleError(res, {
        errorType: `file-${errorKey}-error`,
        message: `Failed to upload ${errorMsgKey}`,
      });
    }
  };
  return handler;
};
