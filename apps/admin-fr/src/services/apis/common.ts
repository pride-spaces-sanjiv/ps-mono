import { BASE } from "./config";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { queryToString } from "@/utils/axios/query";
// import { addChannelSchema, channelSchema } from "@/utils/schemas/channel";
import type {
  GeneralResponseWithError,
  PaginatedResponse,
} from "@/types/axios/response";
import type { Group, Provider, Channel } from "@/types/data/media";

export type ProvidersRes = GeneralResponseWithError<
  PaginatedResponse<{ results?: Provider[] }>
>;
export type GroupsRes = GeneralResponseWithError<
  PaginatedResponse<{ results?: Group[] }>
>;
export type ChannelRes = GeneralResponseWithError<
  PaginatedResponse<{ results?: Channel[] }>
>;

export const getProviders = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/no-route" + queryToString(param?.query);
    const res = await BASE.get<ProvidersRes>(url, config);
    return res;
  },
});

export const getCommonGroups = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/no-route" + queryToString(param?.query);
    const res = await BASE.get<GroupsRes>(url, config);
    return res;
  },
});

export const getCommonChannels = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/no-route" + queryToString(param?.query);
    const res = await BASE.get<ChannelRes>(url, config);
    return res;
  },
});

export const updateChannel = APIBodyValidationWrapper({
  // schema: addChannelSchema.pick([
  //   "groupId",
  //   "enabled",
  //   "keyType",
  //   "name",
  //   "streamType",
  //   "streamUrl",
  // ]),
  handle: async (param, config) => {
    const url = "/no-route" + queryToString(param?.query);
    const res = await BASE.put<ChannelRes>(url, param?.body, config);
    return res;
  },
});
