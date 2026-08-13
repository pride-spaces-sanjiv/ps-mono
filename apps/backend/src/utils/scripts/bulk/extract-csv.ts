import { createReadStream } from "fs";
import path from "path";
import * as csv from "fast-csv";
import { Readable } from "stream";
import { shortenKeys } from "@/utils/object/shorten-keys.js";

export const extractCSV = <R extends Record<string, unknown>>(
  csvFile: string | Readable,
) => {
  const rows: R[] = [];
  const stream =
    typeof csvFile === "string"
      ? createReadStream(path.resolve(csvFile))
      : csvFile;
  return new Promise<typeof rows>((res, rej) => {
    stream
      .pipe(
        csv.parse({
          headers: (hds) =>
            hds.map((s) =>
              s
                ?.trim()
                ?.replace(/[^A-z0-9]+/g, "")
                .toLowerCase(),
            ),
        }),
      )
      .on("error", (error) => {
        rej(error);
      })
      .on("data", (row: (typeof rows)[number]) => {
        const convertedRow = shortenKeys(row);
        rows.push(row);
      })
      .on("end", (rowCount: number, ...args: any[]) => {
        console.log(`Parsed ${rowCount} rows`, "Args :", ...args);
        console.log(rows);
        res(rows);
        // fs.writeFileSync("./parsed-data.json", JSON.stringify(rows, null, 2));
      });
  });
};
