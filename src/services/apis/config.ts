import axios from "axios";
import * as secureStorage from "@secure-storage/common";
import type { TokenData } from "../store/user";

const baseUrl = import.meta.env.VITE_BASE_API;
const baseUrl2 = "https://ps-backend.sanjiv.ip-ddns.com";
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

export const BASE = axios.create({
  baseURL: baseUrl,
  headers: jsonContentHeaders,
  withCredentials: true,
});
export const BASE_WITH_BEARER = axios.create({
  baseURL: baseUrl,
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});

// Admin configs
export const ADMIN = axios.create({
  baseURL: baseUrl + "/admin",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ADMIN_AUTH = axios.create({
  baseURL: baseUrl + "/admin/auth",
  headers: jsonContentHeaders,
  withCredentials: true,
});
export const ADMIN_DATA = axios.create({
  baseURL: baseUrl + "/admin/data",
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
export const ADMIN_OPERATOR = ADMIN.create({
  baseURL: baseUrl + "/admin/operators",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ADMIN_BUILDER = ADMIN.create({
  baseURL: baseUrl + "/admin/builders",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ADMIN_CONVENTIONAL = ADMIN.create({
  baseURL: baseUrl + "/admin/conventionals",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ADMIN_SPACE = ADMIN.create({
  baseURL: baseUrl + "/admin/spaces",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ADMIN_FILE = ADMIN.create({
  baseURL: baseUrl + "/admin/files",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ADMIN_AMENITY = ADMIN.create({
  baseURL: baseUrl + "/admin/amenities",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ADMIN_DUMP = ADMIN.create({
  baseURL: baseUrl + "/admin/dumps",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});

// OPERATOR
export const OPERATOR = axios.create({
  baseURL: baseUrl + "/operator",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const OPERATOR_AUTH = axios.create({
  baseURL: baseUrl + "/operator/auth",
  headers: jsonContentHeaders,
  withCredentials: true,
});
export const OPERATOR_DATA = axios.create({
  baseURL: baseUrl + "/operator/data",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const OPERATOR_SPACE = OPERATOR.create({
  baseURL: baseUrl + "/operator/spaces",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const OPERATOR_AMENITY = OPERATOR.create({
  baseURL: baseUrl + "/operator/amenities",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});

// ENTERPRISE

export const ENTERPRISE = axios.create({
  baseURL: baseUrl + "/enterprise",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const SPACES = axios.create({
  baseURL: baseUrl2 + "/admin/spaces",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const ENTERPRISE_AUTH = axios.create({
  baseURL: baseUrl + "/enterprise/auth",
  headers: jsonContentHeaders,
  withCredentials: true,
});
export const ENTERPRISE_DATA = axios.create({
  baseURL: baseUrl + "/enterprise/data",
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

// General
export const STATES = ENTERPRISE.create({
  baseURL: baseUrl + "/states",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
export const CITIES = ENTERPRISE.create({
  baseURL: baseUrl + "/states/cities",
  headers: jsonContentHeadersAuth,
  withCredentials: true,
});
