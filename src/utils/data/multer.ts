import { ErrorCode } from "multer";

export const multerErrorMapping = {
  LIMIT_PART_COUNT: {
    errorType: "file-part-count-limit",
    message: "Too many parts in the multipart form data.",
  },
  LIMIT_FILE_COUNT: {
    errorType: "file-count-limit",
    message: "Maximum number of allowed files exceeded.",
  },
  LIMIT_FIELD_KEY: {
    errorType: "field-key-limit",
    message: "Field name is too long.",
  },
  LIMIT_FIELD_VALUE: {
    errorType: "field-value-limit",
    message: "Field value exceeds the maximum allowed size.",
  },
  LIMIT_FIELD_COUNT: {
    errorType: "field-count-limit",
    message: "Maximum number of allowed fields exceeded.",
  },
  LIMIT_UNEXPECTED_FILE: {
    errorType: "unexpected-file",
    message: "Unexpected file field encountered. Please check the field name.",
  },
  LIMIT_FILE_SIZE: {
    errorType: "file-size-limit",
    message: "File size exceeds the allowed limit.",
  },
  MISSING_FIELD_NAME: {
    errorType: "missing-field-name",
    message: "Field name is missing for the uploaded file.",
  },
} as Record<ErrorCode, { errorType: string; message: string }>;
