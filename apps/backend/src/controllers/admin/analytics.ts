import { ResponseHandler } from "@/middlewares/request.js";
import { Space } from "@pride-spaces/backend/database/models/space.js";
import { Operator } from "@pride-spaces/backend/database/models/operator.js";
import { WorkspaceUnit } from "@pride-spaces/backend/database/models/workspaceUnit.js";
import type {
  ManagedRequest,
  ManagedResponse,
} from "@pride-spaces/backend/types/request.js";

export const getAnalyticsData = async (
  req: ManagedRequest<any, any>,
  res: ManagedResponse,
) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Basic counts
    const totalOperators = await Operator.countDocuments({});
    const newOperatorsThisMonth = await Operator.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    const totalCentres = await Space.countDocuments({});
    const newCentresThisMonth = await Space.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Active & Verified Centres
    const activeCentres = await Space.countDocuments({
      "flags.isActive": true,
    });
    const verifiedCentres = await Space.countDocuments({
      "flags.isVerified": true,
    });
    const pendingVerification = await Space.countDocuments({
      $or: [
        { "flags.isVerified": false },
        { "flags.isVerified": { $exists: false } },
        { "flags.isVerified": null },
      ],
    });

    // Summing areas & seats
    const areaAndSeats = await Space.aggregate([
      {
        $group: {
          _id: null,
          totalSqFt: { $sum: "$specs.area" },
          totalSeats: { $sum: "$seats.total" },
          bookedSeats: { $sum: "$seats.booked" },
          totalReviews: { $sum: "$reviews" },
          averageRating: { $avg: "$rating" },
          averageSeatPrice: { $avg: "$pricing.perSeat" },
        },
      },
    ]);

    const {
      totalSqFt = 0,
      totalSeats = 0,
      bookedSeats = 0,
      totalReviews = 0,
      averageRating = 0,
      averageSeatPrice = 0,
    } = areaAndSeats[0] || {};

    const availableSeats = totalSeats - bookedSeats;

    // Cities count
    const totalCitiesList = await Space.distinct("location.city");
    const totalCities = totalCitiesList.filter(Boolean).length;

    // Workspace Units (meeting rooms, conference rooms, training rooms)
    const meetingRooms = await WorkspaceUnit.countDocuments({
      type: { $regex: /meeting/i },
    });
    const conferenceRooms = await WorkspaceUnit.countDocuments({
      type: { $regex: /conference/i },
    });
    const trainingRooms = await WorkspaceUnit.countDocuments({
      type: { $regex: /training/i },
    });

    // Top Cities Aggregation
    const topCities = await Space.aggregate([
      {
        $match: {
          "location.city": { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: "$location.city",
          centres: { $sum: 1 },
          sqFt: { $sum: "$specs.area" },
        },
      },
      { $sort: { centres: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          city: "$_id",
          centres: 1,
          sqFt: 1,
        },
      },
    ]);

    // Space Type Mix Aggregation
    const spaceTypeMix = await Space.aggregate([
      {
        $match: {
          "specs.spaceType": { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: "$specs.spaceType",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          label: "$_id",
          count: 1,
        },
      },
    ]);

    // Category Mix Aggregation
    const categoryMix = await Space.aggregate([
      {
        $match: {
          "specs.category": { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: "$specs.category",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          label: "$_id",
          count: 1,
        },
      },
    ]);

    // Grade Mix Aggregation
    const gradeMix = await Space.aggregate([
      {
        $match: {
          "specs.grade": { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: "$specs.grade",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          label: "$_id",
          count: 1,
        },
      },
    ]);

    const analyticsData = {
      totalOperators,
      newOperatorsThisMonth,
      totalCentres,
      newCentresThisMonth,
      totalSqFt,
      totalCities,
      totalSeats,
      bookedSeats,
      availableSeats,
      activeCentres,
      verifiedCentres,
      pendingVerification,
      averageRating: averageRating || 0,
      totalReviews: totalReviews || 0,
      averageSeatPrice: averageSeatPrice || 0,
      meetingRooms,
      conferenceRooms,
      trainingRooms,
      topCities,
      spaceTypeMix,
      categoryMix,
      gradeMix,
    };

    ResponseHandler.handleSuccess(res, {
      message: "Got dynamic analytics summary",
      data: analyticsData,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-analytics-error",
      message: "Failed to load dashboard analytics data",
      // @ts-ignore
      error: err,
    });
  }
};
