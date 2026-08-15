import {
  _Object,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
} from "@aws-sdk/client-s3";
import { rustfsClient } from "./instance.js";

export const listS3Objects = async (
  inputArgs: Omit<ListObjectsV2CommandInput, "ContinuationToken" | "Bucket"> &
    Partial<Pick<ListObjectsV2CommandInput, "Bucket">>,
) => {
  let continuationToken: string | undefined;
  let objects = [] as _Object[];

  do {
    const { Contents, NextContinuationToken, $metadata } =
      await rustfsClient.send(
        new ListObjectsV2Command({
          Bucket: "pridespaces",
          ...inputArgs,
          ContinuationToken: continuationToken,
        }),
      );

    if (Contents) {
      objects.push(...Contents);
    }

    continuationToken = NextContinuationToken;
  } while (continuationToken);

  return objects;
};
