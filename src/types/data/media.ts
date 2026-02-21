import type { Datified } from "@/utils/object/datify";
import type { DatifiedGeneralData, GeneralData } from "./general";
import type { keyTypes, streamTypes } from "@/utils/schemas/channel";

// Raw types
export type RawProvider = { name: string; aliasId: number; enabled?: boolean };
export type RawGroup = { name: string; provider: number };
export type RawUserGroup = {
  name: string;
  referenceGroup?: string;
  channels?: string[];
  createdBy: string;
};
export type RawChannel = {
  tvgId?: string;
  tvgLogo?: string;
  tvgName?: string;
  groupId?: string;
  provider?: number;
  keyType?: (typeof keyTypes)[number];
  streamType?: (typeof streamTypes)[number];
  name: string;
  enabled?: boolean;
  streamUrl?: string;
};

export type Provider = GeneralData & RawProvider;
export type Group = GeneralData & RawGroup;
export type UserGroup = GeneralData & RawUserGroup;
export type Channel = GeneralData & RawChannel;
export type PlaylistChannel = Omit<
  RawChannel,
  "groupId" | "provider" | "enabled"
> & { groupTitle?: string; headers?: Record<string, string> };

export type DatifiedProvider = DatifiedGeneralData & RawProvider;
export type DatifiedGroup = DatifiedGeneralData & RawGroup;
export type DatifiedUserGroup = DatifiedGeneralData & RawUserGroup;
export type DatifiedChannel = DatifiedGeneralData & RawChannel;
