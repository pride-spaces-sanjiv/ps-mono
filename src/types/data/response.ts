import type { GeneralResponseWithError } from "../axios/response";

export type TokenRes = GeneralResponseWithError<{
  token: string;
  refreshToken: string;
  id: string;
  expiry: string;
}>;
