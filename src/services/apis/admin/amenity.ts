import { ADMIN_AMENITY } from "../config";
import { spaceSchema } from "@/utils/schemas/spaces";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { queryToString } from "@/utils/axios/query";
// types
import type {
  GeneralResponseWithError,
  PaginatedResponse,
} from "@/types/axios/response";
import type { Amenity } from "@/types/data/amenity";

type AmenitiesRes = GeneralResponseWithError<
  PaginatedResponse<
    Partial<{
      results: Amenity[];
    }>
  >
>;
// type References = Partial<{ [k: string]: Record<string, any> | null }>;

// 🔹 Get All Spaces (Paginated)
export const getAmenities = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await ADMIN_AMENITY.get<AmenitiesRes>(url, config);
    return res;
  },
});

export const getAmenity = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await ADMIN_AMENITY.get<GeneralResponseWithError<Amenity>>(
      url,
      config,
    );

    return res;
  },
});

// 🔹 Create
export const createAmenity = APIBodyValidationWrapper({
  schema: spaceSchema,
  handle: async (param, config) => {
    const url = "/";
    const res = await ADMIN_AMENITY.post<GeneralResponseWithError<Amenity>>(
      url,
      param?.body,
      config,
    );
    return res;
  },
});

// 🔹 Update
export const updateAmenity = APIBodyValidationWrapper({
  schema: spaceSchema.partial(),
  handle: async (param, config) => {
    const url = `/${param?.url}`;

    const res = await ADMIN_AMENITY.put<GeneralResponseWithError<Amenity>>(
      url,
      param?.body,
      config,
    );

    return res;
  },
});

// 🔹 Delete
export const deleteAmenity = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await ADMIN_AMENITY.delete<
      GeneralResponseWithError<Pick<Amenity, "id">>
    >(url, config);
    return res;
  },
});
