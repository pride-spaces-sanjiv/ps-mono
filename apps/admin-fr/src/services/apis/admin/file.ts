import { ADMIN_FILE } from "../config";
import { spaceSchema } from "@/utils/schemas/spaces";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { queryToString } from "@/utils/axios/query";

import type {
  GeneralResponseWithError,
  PaginatedResponse,
} from "@/types/axios/response";

import type { Space } from "@/types/data/spaces";
import type { FilesResData } from "@/types/data/file";

type FileUploadRes = GeneralResponseWithError<FilesResData>;

// 🔹 Upload Image
export const uploadImageFile = APIBodyValidationWrapper<
  FileUploadRes,
  FormData
>({
  handle: async (param, config) => {
    const url = (
      `/image` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await ADMIN_FILE.postForm<FileUploadRes>(
      url,
      param?.body,
      config,
    );
    return res;
  },
});

// 🔹 Upload Layout
export const uploadLayoutFile = APIBodyValidationWrapper<
  FileUploadRes,
  FormData
>({
  handle: async (param, config) => {
    const url = (
      `/layout` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await ADMIN_FILE.postForm<FileUploadRes>(
      url,
      param?.body,
      config,
    );
    return res;
  },
});

// 🔹 Upload Migration
export const uploadMigrationFile = APIBodyValidationWrapper<
  FileUploadRes,
  FormData
>({
  handle: async (param, config) => {
    const url = (
      `/migration` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await ADMIN_FILE.postForm<FileUploadRes>(
      url,
      param?.body,
      config,
    );
    return res;
  },
});
