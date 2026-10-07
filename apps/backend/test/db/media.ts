import { ENV } from "@pride-spaces/common/utils/env.js";
ENV;
// console.log(ENV);

import { MediaTemp } from "@pride-spaces/backend/database/models/media.js";
import { ModelToRaw } from "@pride-spaces/backend/types/mongoose/document.js";
import {
  mediaStatuses,
  mediaTypes,
  MediaStatus,
  MediaType,
} from "@pride-spaces/common/utils/data/media.js";
import { DefaultTimestampProps } from "mongoose";
import moment from "moment";

const createMediaRecord = async (
  data: Omit<
    ModelToRaw<typeof MediaTemp>,
    keyof DefaultTimestampProps | "id" | "_id"
  >,
) => {
  const doc = new MediaTemp(data);
  await doc.save();
  return doc;
};

const mediaRecord = await createMediaRecord({
  fileId: "019edb06-2924-73a8-a1d3-d3070ef611c5.png",
  status: mediaStatuses.UPLOAD,
  mediaType: mediaTypes.IMAGE,
  expectedDeletion: moment().toDate(),
});
console.log(mediaRecord);
