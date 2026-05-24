import { ADMIN_DUMP } from "../config";
import { amenitySchema } from "@/utils/schemas/amenity";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { queryToString } from "@/utils/axios/query";
import { adminSchema, type AdminSchema } from "@/utils/schemas/user";
// types
import type {
  GeneralResponseWithError,
  PaginatedResponse,
} from "@/types/axios/response";
import { type Dump } from "@/types/data/dump";

type DumpsRes = GeneralResponseWithError<
  PaginatedResponse<
    Partial<{
      results: Dump[];
    }>
  >
>;

// 🔹 Get All (Paginated)
export const getDumps = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await ADMIN_DUMP.get<DumpsRes>(url, config);
    return res;
  },
});

export const getDump = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await ADMIN_DUMP.get<GeneralResponseWithError<Dump>>(
      url,
      config,
    );

    return res;
  },
});

// 🔹 Create
export const createDump = APIBodyValidationWrapper({
  schema: adminSchema,
  handle: async (param, config) => {
    const url = "/";
    const res = await ADMIN_DUMP.post<GeneralResponseWithError<Dump>>(
      url,
      param?.body,
      config,
    );
    return res;
  },
});

// 🔹 Update
export const updateDump = APIBodyValidationWrapper({
  schema: adminSchema.omit({ password: true }).partial(),
  handle: async (param, config) => {
    const url = `/${param?.url}`;

    const res = await ADMIN_DUMP.put<GeneralResponseWithError<Dump>>(
      url,
      param?.body,
      config,
    );

    return res;
  },
});

// 🔹 Approve
export const approveDump = APIBodyValidationWrapper({
  schema: adminSchema.omit({ password: true }).partial(),
  handle: async (param, config) => {
    const url = `/approve/${param?.url}`;

    const res = await ADMIN_DUMP.put<GeneralResponseWithError<Dump>>(
      url,
      param?.body,
      config,
    );

    return res;
  },
});

// 🔹 Delete
export const deleteDump = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await ADMIN_DUMP.delete<
      GeneralResponseWithError<Pick<Dump, "id">>
    >(url, config);
    return res;
  },
});
