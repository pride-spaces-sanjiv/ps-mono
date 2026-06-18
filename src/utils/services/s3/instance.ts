import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
} from "@aws-sdk/client-s3";
import { v7 } from "uuid";
import { DiskStorageOptions, StorageEngine } from "multer";
import { mediaTypes } from "@/utils/data/media.js";
import path from "path";

export const rustfsClient = new S3Client({
  endpoint: process.env.RUSTFS_ENDPOINT as string,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.RUSTFS_ACCESS_KEY as string,
    secretAccessKey: process.env.RUSTFS_SECRET_KEY as string,
  },
  forcePathStyle: true,
});

export class S3StorageEngine {
  bucketName: undefined | string | null = undefined;
  s3Client: undefined | null | typeof rustfsClient = rustfsClient;

  constructor(
    options: Partial<{
      bucketName: string;
      s3Client: typeof rustfsClient;
    }> = {},
  ) {
    this.bucketName = options.bucketName?.trim() || undefined;
    this.s3Client = options.s3Client || rustfsClient;
  }

  validate: () => asserts this is Omit<
    typeof this,
    "bucketName" | "s3Client"
  > & {
    bucketName: string;
    s3Client: typeof rustfsClient;
  } = () => {
    if (!this.bucketName) {
      throw new Error("Bucket name is required");
    }
    if (!this.s3Client) {
      throw new Error("S3 client is required");
    }
  };

  // Destination handler
  destination: Exclude<DiskStorageOptions["destination"], undefined | string> =
    (req, file, cb) => {
      const { fileType = mediaTypes.IMAGE } = req.res?.locals || {};
      cb(null, `${fileType?.trim() || ""}s/`.replace(/^s\//, "unknown/"));
    };

  // Filename handler
  filename: Exclude<DiskStorageOptions["filename"], undefined> = (
    req,
    file,
    cb,
  ) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${v7()}${ext}`);
  };

  // Main method to handle file upload
  _handleFile: StorageEngine["_handleFile"] = (req, file, cb) => {
    this.validate(); // Pre Validate
    console.log("Uploading file", file);

    // Handle Destination firstly
    this.destination(req, file, (err, destination) => {
      console.log("Step 1: Handling destination", { file, destination });
      if (err) {
        return cb(err);
      }
      // file.destination = destination;

      // Secondly handle filename
      this.filename(req, file, (err, filename) => {
        console.log("Step 2: Handling filename", {
          file,
          filename,
          destination,
        });

        if (err) {
          return cb(err);
        }
        // file.filename = filename;

        // Now upload lastly
        // Define the parameters for the S3 upload
        const key = path.join(destination, filename);
        // file.path = key;
        const uploadParams = {
          Bucket: this.bucketName,
          Key: key,
          Body: file.stream,
          ContentType: file.mimetype,
        } as PutObjectCommandInput;

        // Upload the file to S3
        this.s3Client?.send(new PutObjectCommand(uploadParams), (err, data) => {
          console.log("Step 3: Uploading file", {
            file,
            key,
            data,
            filename,
            destination,
          });
          if (err) {
            console.log("Error uploading file", err);
            return cb(err); // Callback with the error
          }

          // Callback with the file metadata
          // @ts-ignore
          cb(null, { destination, filename, path: key, storageStats: data });
        });
      });
    });
  };

  // Optional method to handle file deletion
  _removeFile: StorageEngine["_removeFile"] = (req, file, cb) => {
    this.validate(); // Pre Validate

    // Define the parameters for the S3 deletion
    const key = path.join(file.destination, file.filename);
    const deleteParams = {
      Bucket: this.bucketName,
      Key: key,
    } as DeleteObjectCommandInput;

    // Delete the file from S3
    this.s3Client?.send(new DeleteObjectCommand(deleteParams), (err, data) => {
      if (err) {
        console.log("Error deleting file", err);
        return cb(err); // Callback with the error
      }

      // Callback with the file metadata
      // @ts-ignore
      cb(null);
    });
  };
}
