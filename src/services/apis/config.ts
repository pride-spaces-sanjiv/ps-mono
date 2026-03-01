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

// Admin configs

export const ADMIN = axios.create({
  baseURL: baseUrl + "/admin",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ADMIN_AUTH = axios.create({
  baseURL: baseUrl + "/admin/auth",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ADMIN_ENTERPRISE = ADMIN.create({
  baseURL: baseUrl + "/admin/enterprises",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ADMIN_ADMIN = ADMIN.create({
  baseURL: baseUrl + "/admin/admins",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ADMIN_BRANCH = ADMIN.create({
  baseURL: baseUrl + "/admin/branches",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ADMIN_SPACE = ADMIN.create({
  baseURL: baseUrl + "/admin/spaces",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});

// Enterprise

export const ENTERPRISE = axios.create({
  baseURL: baseUrl + "/enterprise",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ENTERPRISE_AUTH = axios.create({
  baseURL: baseUrl + "/enterprise/auth",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ENTERPRISE_BRANCH = ENTERPRISE.create({
  baseURL: baseUrl + "/enterprise/branches",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ENTERPRISE_SPACE = ENTERPRISE.create({
  baseURL: baseUrl + "/enterprise/spaces",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
