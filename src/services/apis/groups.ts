import { GROUP } from "./config";
import { groupSchema } from "@/utils/schemas/group";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { queryToString } from "@/utils/axios/query";
import type {
  GeneralResponseWithError,
  PaginatedResponse,
} from "@/types/axios/response";
import type { UserGroup } from "@/types/data/media";

export type UserGroupsRes = GeneralResponseWithError<
  PaginatedResponse<{ results?: UserGroup[] }>
>;

export const getGroups = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/list" + queryToString(param?.query);
    const res = await GROUP.get<UserGroupsRes>(url, config);
    return res;
  },
});
export const createGroup = APIBodyValidationWrapper({
  schema: groupSchema,
  handle: async (param, config) => {
    const url = "/";
    const res = await GROUP.post<GeneralResponseWithError<UserGroup>>(
      url,
      param?.body,
      config
    );
    return res;
  },
});

export const deleteGroup = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/" + queryToString(param?.query);
    const res = await GROUP.delete<GeneralResponseWithError<any>>(url, config);
    return res;
  },
});
