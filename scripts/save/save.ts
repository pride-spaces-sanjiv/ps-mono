import { writeFileSync } from "fs";
import { Abortable } from "mongodb";
import { QueryOptions } from "mongoose";
import { Model, ProjectionType, RootFilterQuery } from "mongoose";
import path from "path";

// Get docs of a model

type GetDocsOptions<T extends any> = Partial<{
  filter?: RootFilterQuery<T>;
  projection: ProjectionType<T>;
  options: QueryOptions<T> & { lean?: true } & Abortable;
  page?: number;
  limit?: number;
}>;

const getDocs = async <T extends any>(
  model: Model<T>,
  options: Partial<GetDocsOptions<T>> = {},
) => {
  try {
    const {
      filter = {},
      projection,
      options: queryOpts,
      page = 1,
      limit,
    } = options;
    const count = await model
      .find(filter, projection, queryOpts)
      .countDocuments();
    console.log("Total docs :", count);
    const skipOffset = (page - 1) * (limit || count);
    console.log("Skip offset :", skipOffset);
    const docs = (
      await model
        .find(filter, projection, queryOpts)
        .skip(skipOffset)
        .limit(limit || count)
    ).map((doc) => doc.toJSON({ flattenMaps: true, flattenObjectIds: true }));
    return docs;
  } catch (err) {
    console.error("Failed to get docs:", err);
    throw err;
  }
};

export const saveDocs = async <T>(
  fileName: string,
  model: Model<T>,
  options: Partial<GetDocsOptions<T>> = {},
) => {
  const docs = await getDocs(model, options);
  writeFileSync(path.join("data/", fileName), JSON.stringify(docs));
};
