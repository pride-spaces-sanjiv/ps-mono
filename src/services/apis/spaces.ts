import { SPACES } from "./config";
import { spaceSchema } from "@/utils/schemas/space";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { queryToString } from "@/utils/axios/query";

import type {
  GeneralResponseWithError,
  PaginatedResponse,
} from "@/types/axios/response";

import type { Space } from "@/types/data/spaces";

type SpacesRes = GeneralResponseWithError<
  PaginatedResponse<Partial<{ results: Space[] }>>
>;


// 🔹 Get All Spaces (Paginated)
export const getSpaces = APIBodyValidationWrapper({
  handle: async (_param, config) => {
    const res = await SPACES.get("", config);
    return res;
  },
});


// 🔹 Get Single Space
export const getSpaceData = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/" + queryToString(param?.query);
    const res = await SPACES.get<GeneralResponseWithError<Space>>(
      url,
      config
    );
    return res;
  },
});


// 🔹 Create Space
export const createSpace = APIBodyValidationWrapper({
  schema: spaceSchema,
  handle: async (param, config) => {
    const url = "/";
    const res = await SPACES.post<GeneralResponseWithError<Space>>(
      url,
      param?.body,
      config
    );
    return res;
  },
});


// 🔹 Update Space
export const updateSpace = APIBodyValidationWrapper({
  schema: spaceSchema.partial(),
  handle: async (param, config) => {
    const url = "/" + queryToString(param?.query);
    const res = await SPACES.put<GeneralResponseWithError<Space>>(
      url,
      param?.body,
      config
    );
    return res;
  },
});


// 🔹 Delete Space
export const deleteSpace = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/" + queryToString(param?.query);
    const res = await SPACES.delete<
      GeneralResponseWithError<Pick<Space, "id">>
    >(url, config);
    return res;
  },
});