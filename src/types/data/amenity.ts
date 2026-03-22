import type { Datified } from "@/utils/object/datify";
import type { GeneralData } from "./general";
import type { AmenitySchema } from "@/utils/schemas/amenity";

export type Amenity = GeneralData & Omit<Partial<AmenitySchema>, "password">;

export type DatifiedSpace = Datified<Amenity, ["createdAt", "updatedAt"]>;
