import { ENV } from "@pride-spaces/common/utils/env.js";
ENV;

import { Space } from "@pride-spaces/backend/database/models/space.js";
import { ModelToRaw } from "@pride-spaces/backend/types/mongoose/document.js";
import {
  mediaStatuses,
  mediaTypes,
  MediaStatus,
  MediaType,
} from "@pride-spaces/common/utils/data/media.js";
import { DefaultTimestampProps } from "mongoose";
import moment from "moment";

const updateSpaceImages = async (
  data: Pick<ModelToRaw<typeof Space>, "id" | "files">,
) => {
  const res = await Space.findOneAndUpdate(
    { _id: data.id },
    { "files.images": data.files?.images },
  );
  return res;
};

const existingSpaces = await Space.find({});
for (let i = 0; i < existingSpaces.length; i++) {
  const space = existingSpaces[i];
  const images = Array.isArray(space.files?.images)
    ? (space.files?.images as string[])
    : null;
  console.log(space.name, "images :", space.files?.images);
  if (images) {
    const res = await updateSpaceImages({
      id: space.id,
      files: {
        // @ts-ignore
        images: { default: images },
      },
    });
    console.log(space.name + " changes : " + res?.getChanges());
  }
}
