import dotenv from "dotenv";
import path from "path";

const env = "dev";
dotenv.config({ path: path.resolve(process.cwd(), `.env.${env}`) });

async function run() {
  try {
    const { Conn } = await import("../src/database/mongoose.js");
    const { Space } = await import("../src/database/models/space.js");
    const { Operator } = await import("../src/database/models/operator.js");
    const { WorkspaceUnit } = await import("../src/database/models/workspaceUnit.js");

    console.log("Connected to DB!");

    // Date calculations for new operators/centres this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Basic Counts
    const totalOperators = await Operator.countDocuments({});
    const newOperatorsThisMonth = await Operator.countDocuments({ createdAt: { $gte: startOfMonth } });
    
    const totalCentres = await Space.countDocuments({});
    const newCentresThisMonth = await Space.countDocuments({ createdAt: { $gte: startOfMonth } });

    // Active & Verified Centres
    const activeCentres = await Space.countDocuments({ "flags.isActive": true });
    const verifiedCentres = await Space.countDocuments({ "flags.isVerified": true });
    const pendingVerification = await Space.countDocuments({
      $or: [{ "flags.isVerified": false }, { "flags.isVerified": { $exists: false } }, { "flags.isVerified": null }]
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
          averageSeatPrice: { $avg: "$pricing.perSeat" }
        }
      }
    ]);

    const {
      totalSqFt = 0,
      totalSeats = 0,
      bookedSeats = 0,
      totalReviews = 0,
      averageRating = 0,
      averageSeatPrice = 0
    } = areaAndSeats[0] || {};

    const availableSeats = totalSeats - bookedSeats;

    // Distinct counts
    const totalCitiesList = await Space.distinct("location.city");
    const totalCities = totalCitiesList.length;

    // Workspace Units (meeting rooms, conference rooms, training rooms)
    const meetingRooms = await WorkspaceUnit.countDocuments({ type: { $regex: /meeting/i } });
    const conferenceRooms = await WorkspaceUnit.countDocuments({ type: { $regex: /conference/i } });
    const trainingRooms = await WorkspaceUnit.countDocuments({ type: { $regex: /training/i } });

    // Top Cities Aggregation
    const topCities = await Space.aggregate([
      {
        $group: {
          _id: "$location.city",
          centres: { $sum: 1 },
          sqFt: { $sum: "$specs.area" }
        }
      },
      { $sort: { centres: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          city: "$_id",
          centres: 1,
          sqFt: 1
        }
      }
    ]);

    // Space Type Mix Aggregation
    const spaceTypeMix = await Space.aggregate([
      {
        $group: {
          _id: "$specs.spaceType",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          label: "$_id",
          count: 1
        }
      }
    ]);

    // Category Mix Aggregation
    const categoryMix = await Space.aggregate([
      {
        $group: {
          _id: "$specs.category",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          label: "$_id",
          count: 1
        }
      }
    ]);

    // Grade Mix Aggregation
    const gradeMix = await Space.aggregate([
      {
        $group: {
          _id: "$specs.grade",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          label: "$_id",
          count: 1
        }
      }
    ]);

    const result = {
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
      gradeMix
    };

    console.log("Aggregated Dashboard Data:");
    console.log(JSON.stringify(result, null, 2));

    await Conn.connection.close();
  } catch (err) {
    console.error("Error running aggregations:", err);
  }
}

run();
