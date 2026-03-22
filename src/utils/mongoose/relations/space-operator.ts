import { Types } from "mongoose";
import { Operator } from "@/database/models/operator.js";
import { Space } from "@/database/models/space.js";
import { ModelToRaw } from "@/types/mongoose/document.js";

export const getSpaceOperatorsData = async (operators: string[]) => {
  // Count Spaces
  const spaceCounts = Object.fromEntries(
    (
      await Space.aggregate([
        {
          $match: {
            operator: {
              $in: operators,
            },
          },
        },
        {
          $group: {
            _id: "$operator",
            totalSpaces: { $sum: 1 },
          },
        },
      ])
    ).map((item) => [item._id, item.totalSpaces]) as [string, number][],
  );
  let results = (await Operator.find({ _id: { $in: operators } })).map(
    (doc) => ({ ...doc.toObject(), totalSpaces: spaceCounts[doc.id] || 0 }),
  );
  // const results = (await Operator.aggregate([
  //   {
  //     // 1. Filter operators immediately (High efficiency)
  //     $match: { _id: { $in: operators.map((id) => new Types.ObjectId(id)) } },
  //   },
  //   {
  //     // 2. Efficient lookup that only returns the count
  //     $lookup: {
  //       from: Space.collection.name, // The collection name in your DB
  //       localField: "_id", // Operator ID
  //       foreignField: "operator", // Reference field in Space model
  //       pipeline: [{ $count: "count" }], // ONLY calculate the count inside MongoDB
  //       as: "spaceCountData",
  //     },
  //   },
  //   {
  //     // 3. Clean up the output so it's a simple number
  //     $addFields: {
  //       totalSpaces: {
  //         $ifNull: [{ $arrayElemAt: ["$spaceCountData.count", 0] }, 0],
  //       },
  //     },
  //   },
  //   {
  //     // 4. Remove the temporary array
  //     $project: { spaceCountData: 0 },
  //   },
  // ])) as (Awaited<ReturnType<typeof Operator.find>>[number] & {
  //   totalSpaces: number;
  // })[];

  return results;
};
