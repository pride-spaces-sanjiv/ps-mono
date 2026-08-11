import * as apiConfigs from "@/services/apis/config";
import * as secureStorage from "@secure-storage/common";
import type { AxiosInstance } from "axios";
import type { TokenData } from "@/services/store/user";
import { isAxiosInstance } from "./instance";

const configs = {
  ...Object.fromEntries(
    Object.entries(apiConfigs).filter(([, v]) => isAxiosInstance(v)),
  ),
};
type ConfigInstance = keyof typeof apiConfigs;

/**
 * @description Saves token securely to `__aT__` key, then configures all instances
 * @description Returns `true` if succeeds in configuring
 * @description Returns `false` if fails
 */
export const reConfigureAuthToken = <T extends ConfigInstance>(
  /** @description The auth token required setting up `Authorization` header  */
  token: string,
  /** @description The expiration date of token */
  expiry: Date,
  /** @description Excludes configuring these instances  */
  discardConfigs?: [...T[]],
) => {
  try {
    if (typeof token !== "string" || !token.trim()) {
      throw new Error("Invalid token, must be non-empty string");
    }
    if (!(expiry instanceof Date)) {
      throw new Error("Invalid expiry, must be date");
    }

    token = token.trim();
    const exclude = Array.isArray(discardConfigs) ? discardConfigs : [];

    if (!exclude.every((inst) => Object.keys(configs).includes(inst))) {
      throw new Error("Invalid exclude instance");
    }

    const data = {
      ...secureStorage.localStorage.getItem<Partial<TokenData> | null>(
        "__aT__",
      ),
      token: token,
      expiry: expiry,
    };
    secureStorage.localStorage.setItem("__aT__", data);
    for (const key in configs) {
      if (!exclude.includes(key as T)) {
        const instance = configs[key as ConfigInstance] as AxiosInstance;
        instance.defaults.headers.Authorization = `Bearer ${token}`;
      }
    }
    return true;
  } catch (err) {
    console.error("Token re-configuration error :", err);
    return false;
  }
};
