import { AxiosHeaders, type AxiosResponse } from "axios";
import type { GeneralResponseWithError } from "@/types/axios/response";

export type AnalyticsSummary = {
  totalOperators: number;
  totalCentres: number;
  totalSqFt: number;
  totalCities: number;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  activeCentres: number;
  verifiedCentres: number;
  pendingVerification: number;
  averageRating: number;
  totalReviews: number;
  averageSeatPrice: number;
  meetingRooms: number;
  conferenceRooms: number;
  trainingRooms: number;
  newOperatorsThisMonth: number;
  newCentresThisMonth: number;
  topCities: {
    city: string;
    centres: number;
    sqFt: number;
  }[];
  spaceTypeMix: {
    label: string;
    count: number;
  }[];
  categoryMix: {
    label: string;
    count: number;
  }[];
  gradeMix: {
    label: string;
    count: number;
  }[];
};

export const analyticsPath = "/analytics";

export const staticAnalyticsSummary: AnalyticsSummary = {
  totalOperators: 196,
  totalCentres: 126,
  totalSqFt: 2400000,
  totalCities: 32,
  totalSeats: 18240,
  bookedSeats: 11780,
  availableSeats: 6460,
  activeCentres: 112,
  verifiedCentres: 98,
  pendingVerification: 14,
  averageRating: 4.6,
  totalReviews: 2840,
  averageSeatPrice: 9200,
  meetingRooms: 384,
  conferenceRooms: 142,
  trainingRooms: 76,
  newOperatorsThisMonth: 12,
  newCentresThisMonth: 18,
  topCities: [
    { city: "Bengaluru", centres: 28, sqFt: 620000 },
    { city: "Mumbai", centres: 22, sqFt: 510000 },
    { city: "Delhi NCR", centres: 19, sqFt: 430000 },
    { city: "Hyderabad", centres: 14, sqFt: 310000 },
    { city: "Pune", centres: 11, sqFt: 240000 },
  ],
  spaceTypeMix: [
    { label: "Flex", count: 54 },
    { label: "Managed Office", count: 34 },
    { label: "Private Cabin", count: 21 },
    { label: "Virtual Office", count: 11 },
    { label: "Meeting Space", count: 8 },
  ],
  categoryMix: [
    { label: "Classic", count: 62 },
    { label: "Premium", count: 38 },
    { label: "Enterprise", count: 26 },
  ],
  gradeMix: [
    { label: "A", count: 46 },
    { label: "B", count: 58 },
    { label: "C", count: 22 },
  ],
};

export const getAnalytics = async (): Promise<
  AxiosResponse<GeneralResponseWithError<AnalyticsSummary>>
> => {
  return {
    data: {
      success: true,
      message: "Static analytics summary",
      data: staticAnalyticsSummary,
    },
    status: 200,
    statusText: "OK",
    headers: {},
    config: {
      headers: new AxiosHeaders(),
      url: analyticsPath,
    },
  };
};
