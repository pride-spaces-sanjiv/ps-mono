import axios from "axios";
import * as secureStorage from "@secure-storage/common";
import type { TokenData } from "../store/user";

const baseUrl = import.meta.env.VITE_BASE_API;
const mode = import.meta.env.VITE_ENV_MODE === "dev" ? "dev" : "prod";
const token =
  secureStorage.localStorage.getItem<TokenData | null>("__aT__")?.token || "";

const preHeaders = {
  "X-GAuth-Mode": mode,
  "X-Build-Mode": mode,
};

const jsonContentHeaders = {
  ...preHeaders,
  "Content-Type": "application/json",
};
const jsonContentHeadersAuth = {
  ...jsonContentHeaders,
  Authorization: `Bearer ${token}`,
};

export const AUTH = axios.create({
  baseURL: baseUrl + "/auth",
  headers: jsonContentHeaders,
  withCredentials: true,
});

export const ADMIN = axios.create({
  baseURL: baseUrl + "/admin",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ADMIN_USERS = ADMIN.create({
  baseURL: baseUrl + "/admin/users",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ADMIN_CHANNEL = ADMIN.create({
  baseURL: baseUrl + "/admin/channel",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ADMIN_PLAYLIST = ADMIN.create({
  baseURL: baseUrl + "/admin/playlist",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});

export const ACCOUNT = axios.create({
  baseURL: baseUrl + "/account",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const USERS = axios.create({
  baseURL: baseUrl + "/users",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const GROUP = axios.create({
  baseURL: baseUrl + "/group",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const CHANNEL = axios.create({
  baseURL: baseUrl + "/channel",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const COMMON = axios.create({
  baseURL: baseUrl + "/common",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
