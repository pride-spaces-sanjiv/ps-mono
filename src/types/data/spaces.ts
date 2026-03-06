import type { Datified } from "@/utils/object/datify";

export type Location = {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lat: number;
  lng: number;
};

export type Space = {
  id: string;

  branch: string;
  enterprise: string;

  name: string;
  email: string;

  location: Location;

  description?: string;

  openTime?: string;
  closeTime?: string;

  openDays?: number;

  isVerified: boolean;
  isActive: boolean;

  rating: number;
  reviews: number;

  createdAt: string;
  updatedAt: string;
};
export type DatifiedSpace = Datified<
  Space,
  ["createdAt", "updatedAt", "openTime", "closeTime"]
>;