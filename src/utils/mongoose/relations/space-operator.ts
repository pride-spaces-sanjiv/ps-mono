import { Operator } from "@/database/models/operator.js";

export const getSpaceOperatorsData = async (operators: string[]) => {
  const results = await Operator.find({ _id: { $in: operators } });
  return results;
};
