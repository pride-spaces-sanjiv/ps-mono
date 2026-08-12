export type SpaceGrade = "A" | "other";

export interface SpaceOperator {
  id: string;
  name: string;
  brandName: string;
  totalCentres: number;
  city: string;
  contactEmail: string;
}

export interface SpaceCentre {
  id: string;
  operatorId: string;
  centreName: string;
  city: string;
  address: string;
  grade: SpaceGrade;
}
