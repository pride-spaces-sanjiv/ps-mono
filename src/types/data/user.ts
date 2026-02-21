import type { Datified } from "@/utils/object/datify";

export type User = {
  id: string;
  name: string;
  username: string;
  password: string;
  email?: string;
  level: number;
  credits: number;
  isActive: boolean;
  underUser?: string;
  verified: boolean;
  expiry: string;
  testExpiry?: string;
  phone?: number;
  shortLink?: string;
  enabledGroups: string[];
  userAgents: string[];
  createdAt: string;
  updatedAt: string;
};

export type DatifiedUser = Datified<
  User,
  ["createdAt", "updatedAt", "expiry", "testExpiry"]
>;
