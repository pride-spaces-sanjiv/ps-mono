export const getFullMigrationS3Key = (fileId: string, type: "csv" | "json") =>
  `migrations/${fileId}.${type}`;
