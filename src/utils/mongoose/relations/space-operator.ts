import { Types } from "mongoose";
import { Operator } from "@/database/models/operator.js";
import { Space } from "@/database/models/space.js";
import { ModelToRaw } from "@/types/mongoose/document.js";
import { pipelineDBs } from "@/utils/services/pipeline/db.js";

export const getSpaceCountsOfOperator = async (operators: string[]) => {
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
  return spaceCounts;
};

export const getSpaceOperatorsData = async (operators: string[]) => {
  const spaceCounts = await getSpaceCountsOfOperator(operators);
  let results = (
    await pipelineDBs.OPERATOR.getMultiData({
      filter: { _id: { $in: operators } },
    })
  ).map(
    (doc) =>
      new Operator(
        {
          ...doc.toJSON(),
          totalSpaces: spaceCounts[doc.id] || 0,
        },
        null,
        { strict: false },
      ),
  );
  return results;
};
