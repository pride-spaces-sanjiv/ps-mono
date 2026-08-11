import { OPERATOR_SPACE } from "../config";
import { spaceSchema } from "@/utils/schemas/spaces";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { queryToString } from "@/utils/axios/query";

import type {
  GeneralResponseWithError,
  PaginatedResponse,
} from "@/types/axios/response";

import type { Space } from "@/types/data/spaces";

type SpacesRes = GeneralResponseWithError<
  PaginatedResponse<
    Partial<{
      results: Space[];
      references: Record<
        string,
        Partial<{ results: any[]; metrics: { total: number } }>
      >;
    }>
  >
>;
type References = Partial<{ [k: string]: Record<string, any> | null }>;

// 🔹 Get All Spaces (Paginated)
export const getSpaces = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await OPERATOR_SPACE.get<SpacesRes>(url, config);
    return res;
  },
});

// 🔹 Get Single Space
export const getSpaceData = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await OPERATOR_SPACE.get<
      GeneralResponseWithError<Space & Partial<{ references: References }>>
    >(url, config);
    return res;
  },
});

// 🔹 Create Space
export const createSpace = APIBodyValidationWrapper({
  schema: spaceSchema,
  handle: async (param, config) => {
    const url = "/";
    const res = await OPERATOR_SPACE.post<GeneralResponseWithError<Space>>(
      url,
      param?.body,
      config,
    );
    return res;
  },
});

// 🔹 Update Space
export const updateSpace = APIBodyValidationWrapper({
  schema: spaceSchema.partial(),
  handle: async (param, config) => {
    const url = `/${param?.url}`;

    const res = await OPERATOR_SPACE.put<GeneralResponseWithError<Space>>(
      url,
      param?.body,
      config,
    );

    return res;
  },
});

// 🔹 Delete Space
export const deleteSpace = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await OPERATOR_SPACE.delete<
      GeneralResponseWithError<Pick<Space, "id">>
    >(url, config);
    return res;
  },
});
