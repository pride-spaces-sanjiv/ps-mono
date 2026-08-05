import * as fs from "fs";
import * as path from "path";
import * as csv from "fast-csv";
import moment from "moment";
import { Types } from "mongoose";
import { ENV } from "../src/utils/env";
ENV;
import { encodeCrypto } from "../src/utils/crypto";
import { spaceSchema, SpaceSchema } from "../src/database/schemas/space";
import {
  operatorSchema,
  OperatorSchema,
} from "../src/database/schemas/operator";
import { Space } from "../src/database/models/space";
import { Operator } from "../src/database/models/operator";
import { facilities } from "../src/utils/data/facilities";
import {
  parseBulkOperatorsData,
  pushBulkOperatorsData,
} from "../src/utils/scripts/bulk/operator";
import { extractCSV } from "../src/utils/scripts/bulk/extract-csv.js";
import { RowData as SpaceRowData } from "../src/utils/scripts/data/space-headers.js";
import { RowData as OperatorRowData } from "../src/utils/scripts/data/operator-headers.js";
import {
  parseBulkSpacesData,
  pushBulkSpacesData,
} from "../src/utils/scripts/bulk/space.js";
import { getSpaceCountsOfOperator } from "../src/utils/mongoose/relations/space-operator.js";
const { default: parsedData } = await import("../data/parsed-data.json", {
  assert: { type: "json" },
});
const { default: convertedParsed } = await import(
  "../data/converted-spaces.json",
  {
    assert: { type: "json" },
  }
);
// console.log(parsedData);

// const csvFile =
//   "C:\\Users\\Sanjiv\\OneDrive\\Desktop\\Projects\\pride-spaces\\karnataka-operators.csv";
// const csvFile =
//   "C:\\Users\\Sanjiv\\Downloads\\KA Operator HQ - KA Operator HQ.csv";
// npm run test scripts/bulk -- --env=dev

// const rows: any[] = [];
// fs.createReadStream(path.resolve(csvFile))
//   .pipe(csv.parse({ headers: true }))
//   .on("error", (error) => console.error(error))
//   .on("data", (row) => {
//     rows.push(row);
//   })
//   .on("end", (rowCount: number) => {
//     console.log(`Parsed ${rowCount} rows`);
//     console.log(rows);
//     fs.writeFileSync("./parsed-data.json", JSON.stringify(rows, null, 2));
//   });
let counter = 0;

const operatorId = "69b08adb22a9fe9d0e91127a";

const counts = await getSpaceCountsOfOperator([operatorId]);

counter = counts[operatorId] || 0;

const convertData = (data: (typeof parsedData)[number]) => {
  counter++;

  const converted: SpaceSchema = {
    name: data["Centre Name"].trim(),
    branch: new Types.ObjectId().toHexString(),
    operator: "69b08adb22a9fe9d0e91127a",
    slug: generateSlug(data["Centre Name"], counter),
    isActive: true,
    isVerified: false,
    email: "randommail@gmail.com",
    location: {
      country: "India",
      address: data["Address"].trim(),
      city: data["City"].trim(),
      state: data["State"].trim(),
      postalCode: "000000",
      lat: 0,
      lng: 0,
    },
    person: {
      name: data.Name.trim(),
      email: data.Email.trim(),
      contactNo: data["Contact No."].trim().replace(/ +/g, ""),
    },
    openDays: [1, 2, 3, 4, 5, 6],
    openTime: moment(data["Opening Time "].trim() || "00:00", "HH:mm").toDate(),
    closeTime: moment(data["Closing Time"].trim() || "00:00", "HH:mm").toDate(),
    category:
      data.Category.trim().toLowerCase().includes("platinum") ||
      data.Category.trim().toLowerCase() === "gold"
        ? "Apex"
        : data.Category.trim().toLowerCase() === "silver"
          ? "Elite"
          : "Classic",
    facilities: facilities.filter((f) =>
      data[f]?.trim().toLowerCase().includes("yes"),
    ),
    rating: 0,
    reviews: 0,
    totalSeats: 100,
    bookedSeats: 5,
  };
  const parsed = spaceSchema.safeParse(converted);
  if (!parsed.success) {
    console.log(parsed.error);
    return null;
  }
  return parsed.data;
};

// const convertedSpaces = parsedData
//   .map(convertData)
//   .filter((v): v is NonNullable<typeof v> => !!v);
// fs.writeFileSync(
//   "./data/converted-spaces.json",
//   JSON.stringify(convertedSpaces, null, 2),
// );
// Operator
const csvFile =
  "C:\\Users\\Sanjiv\\OneDrive\\Desktop\\Projects\\pride-spaces\\karnataka-operators.csv";
console.time("Scripting Time :");
const rows = await extractCSV<OperatorRowData>(csvFile);
const bulkedOperators = await parseBulkOperatorsData(rows);
fs.writeFileSync(
  "./data/bulked-operators.json",
  JSON.stringify(bulkedOperators, null, 2),
);
console.timeEnd("Scripting Time :");
// console.time("Push Time :");
// bulkedOperators && (await pushBulkOperatorsData(bulkedOperators));
// console.timeEnd("Push Time :");

// Spaces
// const csvFile = "C:\\Users\\Sanjiv\\Downloads\\KA Operator HQ - Centres 2.csv";
// console.time("Scripting Time :");
// const rows = await extractCSV<SpaceRowData>(csvFile);
// let bulkedSpaces = await parseBulkSpacesData(rows, {
//   preFilter: (row) => row.operatorslug?.toLowerCase().includes("enzyme"),
// });
// // bulkedSpaces = bulkedSpaces?.filter((_, i) => i < 3) || null;
// fs.writeFileSync(
//   "./data/bulked-spaces.json",
//   JSON.stringify(bulkedSpaces, null, 2),
// );
// console.timeEnd("Scripting Time :");

// console.time("Push Time :");
// console.log(bulkedSpaces && (await pushBulkSpacesData(bulkedSpaces, true)));
// console.timeEnd("Push Time :");

let saves = 0;
// await Space.deleteMany();
// for (const space of convertedSpaces) {
//   try {
//     const doc = new Space(space);
//     console.log(doc.slug);
//     await doc.save();
//     saves += 1;
//   } catch (err) {
//     console.log("Failed to push", space.name, err);
//   }
// }
// console.log("Saved", saves);

// const operator: OperatorSchema = {
//   name: "Awfis Space Solutions Limited",
//   slug: "awfis",
//   email: "info@awfis.com",
//   headquarter: { address: "Pune", contactNo: "9999999999" },
//   password: "Awfis@login123",
//   person: {
//     name: "Raghav Mittal",
//     email: "raghav.mittal@awfis.com",
//     role: "Head Manager",
//   },
// };
// if (operatorSchema.safeParse(operator).success) {
//   const data = operatorSchema.safeParse(operator).data;
//   const doc = new Operator({ ...data, password: encodeCrypto(data?.password) });
//   await doc.save();
// }
const generateSlug = (name: string, count: number) => {
  const firstWord = name
    .trim()
    .split(" ")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

  const padded = String(count).padStart(4, "0");

  return `${firstWord}-${padded}`;
};
