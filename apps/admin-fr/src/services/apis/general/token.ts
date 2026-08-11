import { BASE, BASE_WITH_BEARER } from "@/services/apis/config";
import type {
  GeneralResponse,
  GeneralResponseWithError,
} from "@/types/axios/response";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import type { UserType } from "@/utils/data/userTypes";

type TokenInfo = {
  level?: UserType;
};
type TokenInfoRes = GeneralResponseWithError<TokenInfo>;

export const getTokenInfo = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const res = await BASE_WITH_BEARER.get<TokenInfoRes>("/token-info");
    return res;
  },
});
