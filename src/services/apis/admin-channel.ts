import { ADMIN_CHANNEL } from "./config";
import {
  addChannelSchema,
  type AddChannelSchema,
} from "@/utils/schemas/channel";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import type {
  GeneralResponseWithError,
  PaginatedResponse,
} from "@/types/axios/response";
import { type ChannelRes } from "./common";

export const addChannel = APIBodyValidationWrapper({
  schema: addChannelSchema,
  handle: async (param, config) => {
    const url = "/add";
    const res = await ADMIN_CHANNEL.post<ChannelRes>(url, param?.body, config);
    return res;
  },
});

type RedirectURL = {
  domain: string;
  pathname: string;
  href: string;
  query: string;
};
export type TestChannelRes = GeneralResponseWithError<{
  isValidToProvider: boolean;
  matchedProvider: number;
  redirects: { status: number; statusText: string; url: RedirectURL }[];
}>;
export const testChannelStream = APIBodyValidationWrapper({
  schema: addChannelSchema.pick(["provider", "streamUrl"]),
  handle: async (param, config) => {
    const url = "/test-stream";
    const res = await ADMIN_CHANNEL.post<TestChannelRes>(
      url,
      param?.body,
      config,
    );
    return res;
  },
});
