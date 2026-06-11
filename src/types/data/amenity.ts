import type { Datified } from "@/utils/object/datify";
import type { GeneralData } from "./general";
import type { AmenitySchema } from "@/utils/schemas/amenity";
import type { DeepInfer } from "./infer";

export type Amenity = DeepInfer<GeneralData & Omit<Partial<AmenitySchema>, "password">>;

export type DatifiedAmenity = DeepInfer<
  Datified<Amenity, ["createdAt", "updatedAt"]>
>;
