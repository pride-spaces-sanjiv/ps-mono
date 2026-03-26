import { ADMIN_ADMIN } from "../config";
import { amenitySchema } from "@/utils/schemas/amenity";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { queryToString } from "@/utils/axios/query";
import { adminSchema, type AdminSchema } from "@/utils/schemas/user";
// types
import type {
  GeneralResponseWithError,
  PaginatedResponse,
} from "@/types/axios/response";
import type { Admin } from "@/types/data/user";

type AdminsRes = GeneralResponseWithError<
  PaginatedResponse<
    Partial<{
      results: Admin[];
    }>
  >
>;

// 🔹 Get All (Paginated)
export const getAdmins = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await ADMIN_ADMIN.get<AdminsRes>(url, config);
    return res;
  },
});

export const getAdmin = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await ADMIN_ADMIN.get<GeneralResponseWithError<Admin>>(
      url,
      config,
    );

    return res;
  },
});

// 🔹 Create
export const createAdmin = APIBodyValidationWrapper({
  schema: adminSchema,
  handle: async (param, config) => {
    const url = "/";
    const res = await ADMIN_ADMIN.post<GeneralResponseWithError<Admin>>(
      url,
      param?.body,
      config,
    );
    return res;
  },
});

// 🔹 Update
export const updateAdmin = APIBodyValidationWrapper({
  schema: adminSchema.omit({ password: true }).partial(),
  handle: async (param, config) => {
    const url = `/${param?.url}`;

    const res = await ADMIN_ADMIN.put<GeneralResponseWithError<Admin>>(
      url,
      param?.body,
      config,
    );

    return res;
  },
});

// 🔹 Delete
export const deleteAdmin = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await ADMIN_ADMIN.delete<
      GeneralResponseWithError<Pick<Admin, "id">>
    >(url, config);
    return res;
  },
});

// Password
// Get
export const getAdminPassword = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url =
      `/${param?.url || ""}/password${queryToString(param?.query)}`.replace(
        /\/+/g,
        "/",
      );
    const res = await ADMIN_ADMIN.get<
      GeneralResponseWithError<
        Pick<Admin, "id"> &
          Partial<Pick<AdminSchema, "password"> & { decodedPassword: string }>
      >
    >(url, config);
    return res;
  },
});

export const changeAdminPassword = APIBodyValidationWrapper({
  schema: adminSchema.pick({ password: true }),
  handle: async (param, config) => {
    const url =
      `/${param?.url || ""}/password/change${queryToString(param?.query)}`.replace(
        /\/+/g,
        "/",
      );
    const res = await ADMIN_ADMIN.put<
      GeneralResponseWithError<
        Pick<Admin, "id"> & Pick<Partial<AdminSchema>, "password">
      >
    >(url, param?.body, config);
    return res;
  },
});
