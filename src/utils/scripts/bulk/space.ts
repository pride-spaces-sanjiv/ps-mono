import fs from "fs";
import path from "path";
import * as csv from "fast-csv";
import { Operator } from "@/database/models/operator.js";
import {
  BranchSchema,
  type OperatorSchema,
  operatorSchema,
} from "@/database/schemas/operator.js";
import { State } from "@/database/models/state-cities.js";
import { shortenKeys } from "@/utils/object/shorten-keys.js";
import {
  invalidValues,
  validifyStringValues,
} from "@/utils/string/validify-string.js";
import { encodeCrypto } from "@/utils/crypto.js";
import { ModelToRaw } from "@/types/mongoose/document.js";
import { Document, RootFilterQuery, Types } from "mongoose";
import { Amenity } from "@/database/models/amenities.js";
import { Space } from "@/database/models/space.js";
import { SpaceSchema } from "@/database/schemas/space.js";
import moment from "moment";
import { getSpaceCountsOfOperator } from "@/utils/mongoose/relations/space-operator.js";

const CSVHeaders = {
  OPERATORSLUG: "operatorslug",
  OPERATORBRANDNAME: "operatorbrandname",
  CENTRENAME: "centrename",
  ADDRESS: "address",
  AREAMICROMARKET: "areamicromarket",
  CITY: "city",
  BUILDINGGRADE: "buildinggrade",
  SEZNONSEZ: "seznonsez",
  OPERATIONALSINCE: "operationalsince",
  TOTALSEATS: "totalseats",
  CENTREAREAINSQFTAPPROX: "centreareainsqftapprox",
  TYPE: "type",
  STATE: "state",
  CENTERPOCNAME: "centerpocname",
  CENTERPOCEMAIL: "centerpocemail",
  CENTERPOCCONTACTNO: "centerpoccontactno",
  LOCKIN: "lockin",
  NOTICEPERIOD: "noticeperiod",
  SECURITYDEPOSIT: "securitydeposit",
  OPENINGDAY: "openingday",
  CLOSINGDAY: "closingday",
  OPENINGTIME: "openingtime",
  CLOSINGTIME: "closingtime",
  CATEGORY: "category",
  DAYPASS: "daypass",
  MEETINGROOM: "meetingroom",
  DEDICATEDDESK: "dedicateddesk",
  FLEXIHOTDESK: "flexihotdesk",
  PERSEAT: "perseat",
  VOSERVICE: "voservice",
  VOPRICE: "voprice",
  WORKSTATIONSIZE: "workstationsize",
} as const;
type CSVHeadersValues = (typeof CSVHeaders)[keyof typeof CSVHeaders];
type RowData = Record<CSVHeadersValues, string | null | undefined>;

// Objects
const spaceCounts = {} as Record<string, number>;

const extractCSV = (csvFile: string) => {
  const rows: RowData[] = [];
  return new Promise<typeof rows>((res, rej) => {
    fs.createReadStream(path.resolve(csvFile))
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

// Get states data
const getStatesData = async () => {
  const states = await State.find({}).lean();
  return states;
};
type StatesData = Awaited<ReturnType<typeof getStatesData>>;

// Get Amenities data
const getAmenitiesData = async () => {
  const amenities = await Amenity.find({}).lean();
  return amenities;
};
type AmenitiesData = Awaited<ReturnType<typeof getAmenitiesData>>;

// Get Operators data
const getOperatorsData = async (
  options: Partial<{
    filter: RootFilterQuery<ModelToRaw<typeof Operator>>;
  }> = {},
) => {
  const operators = await Operator.find(options.filter || {}).lean();
  return operators;
};
type OperatorsData = Awaited<ReturnType<typeof getOperatorsData>>;

// Slug gen
const generateSlug = (
  row: RowData,
  ind: number,
  operator?: OperatorsData[number],
) => {
  if (operator?.slug) {
    const slug =
      `${operator.slug}-${operator.branches.find((br) => br.name.toLowerCase().trim() === row.state?.trim().toLowerCase())?.code || ""}-${(spaceCounts[operator._id.toHexString()] || 0) + ind + 1}`
        .replace(/\-+/g, "-")
        .toLowerCase()
        .trim();
    return slug;
  }
  return "";
};

const convertAsPhoneNo = (val: string) => {
  val =
    `+91${validifyStringValues(val?.replace(/[^0-9]+/g, "").match(/\d{8,10}$/)?.[0]).trim()}`
      .trim()
      .replace(/^[+]91$/, "");
  return val;
};

// Utils
const generateGrade = (grade?: string | null) => {
  const str = validifyStringValues(grade)
    .toLowerCase()
    .replace(/[^A-z0-9\-]/g, "");
  const val: SpaceSchema["grade"] =
    str.includes(`gradea+`) || str.match(/multi.*tower.*tech.*park/)
      ? "A+"
      : str.includes(`gradea`)
        ? "A"
        : "B";
  return val;
};

const generateSpaceType = (spaceType?: string | null) => {
  const str = validifyStringValues(spaceType)
    .toLowerCase()
    .replace(/[^A-z0-9\-]/g, "");
  const val: SpaceSchema["spaceType"] =
    str.includes(`flex`) && str.includes("mos")
      ? "Both"
      : str.includes(`mos`)
        ? "MOS"
        : "Flex";
  return val;
};

const generateCategory = (cat?: string | null) => {
  const str = validifyStringValues(cat)
    .toLowerCase()
    .replace(/[^A-z0-9\-]/g, "");
  const val: SpaceSchema["category"] = str.includes(`elite`)
    ? "Elite"
    : str.includes(`apex`)
      ? "Apex"
      : "Classic";
  return val;
};

const generatePricing = (row?: RowData) => {
  const pricing: SpaceSchema["pricing"] = {
    dayPass:
      Number(validifyStringValues(row?.daypass).replace(/[^0-9]/g, "")) || 0,
    perSeat:
      Number(validifyStringValues(row?.perseat).replace(/[^0-9]/g, "")) || 0,
    dedicatedDesk:
      Number(validifyStringValues(row?.dedicateddesk).replace(/[^0-9]/g, "")) ||
      0,
    meetingRoom:
      Number(validifyStringValues(row?.meetingroom).replace(/[^0-9]/g, "")) ||
      0,
    flexiDesk:
      Number(validifyStringValues(row?.flexihotdesk).replace(/[^0-9]/g, "")) ||
      0,
    privateCabin: 0,
  };
  return pricing;
};

const generateWorkSizes = (str?: string | null) => {
  const sizes =
    str
      ?.replace(/ +/g, "")
      .toLowerCase()
      .split(",")
      .filter((s) => s.match(/[0-9]+([\`\'\"]|)x[0-9]+([\`\'\"]|)/))
      .map((s) => {
        const matches = s.match(/([0-9]+)([\`\'\"]|)x([0-9]+)([\`\'\"]|)/);
        if (matches) {
          const height = Number(matches?.[1]);
          const width = Number(matches?.[3]);
          const sym = matches?.[2];
          if (sym.trim()) {
            return `${height * 300}x${width * 300}`;
          }
          return `${height}x${width}`;
        }
        return "";
      })
      .filter((s) => s) || [];
  return sizes as SpaceSchema["workingSizes"];
};

const generateTimedDate = (str?: string | null) => {
  const match = str
    ?.trim()
    .replace(/ +/g, "")
    .match(/([0-9]{1,2}:[0-9]{1,2})/);
  if (match) {
    const date = moment();
    const [hours, minutes] = match[1].split(":").map(Number);
    date.hours(hours);
    date.minutes(minutes);
    return date.toDate();
  }
  return undefined;
};

const generateOperationalSince = (str?: string | null) => {
  const parsedMoments = ["MM-YYYY", "YYYY-MM", "MM/YYYY", "YYYY/MM"].map(
    (format) => moment(str, format, true),
  );
  const date = parsedMoments.find((d) => d.isValid());
  if (date) {
    return date.toDate();
  }
  return undefined;
};

const prepareData = (row: RowData, operator?: OperatorsData[number]) => {
  try {
    const opPerson =
      operator?.branches.find((br) => br.isPrimary)?.person || operator?.person;
    const prepared: Partial<SpaceSchema> = {
      operator: operator?._id.toHexString() || "",
      name: validifyStringValues(row.centrename),
      operationalSince: generateOperationalSince(row.operationalsince),
      // email: validifyStringValues(row.hqemailforloginid || row.hqpocemail),
      person: {
        name: validifyStringValues(row.centerpocname || opPerson?.name),
        email: validifyStringValues(row.centerpocemail || opPerson?.email),
        role: validifyStringValues(opPerson?.role),
        contactNo: convertAsPhoneNo(
          validifyStringValues(row.centerpoccontactno || opPerson?.contactNo),
        ),
      },
      location: {
        address: validifyStringValues(row.address),
        area: validifyStringValues(row.areamicromarket),
        state: validifyStringValues(row.state),
        city: validifyStringValues(row.city),
        postalCode:
          validifyStringValues(row.address).match(
            /([^0-9A-z]| )([0-9]{6})([^0-9]|)/,
          )?.[2] || "",
        country: "India",
        lat: 0,
        lng: 0,
      },
      // Create a util to generate from open days
      openDays: Array(6)
        .fill(false)
        .map((_, i) => i + 1),
      openTime: generateTimedDate(row.openingtime),
      closeTime: generateTimedDate(row.closingtime),
      grade: generateGrade(row.buildinggrade),
      totalSeats:
        Number(validifyStringValues(row.totalseats).replace(/[^0-9]/g, "")) ||
        0,
      bookedSeats: 0,
      spaceType: generateSpaceType(row.buildinggrade),
      category: generateCategory(row.category),
      pricing: generatePricing(row),
      area:
        Number(
          validifyStringValues(row.centreareainsqftapprox).replace(
            /[^0-9]/g,
            "",
          ),
        ) || 0,
      workingSizes: generateWorkSizes(row.workstationsize),
      isActive: true,
      isVerified: false,
    };
    return prepared;
  } catch (err) {
    console.error("Failed to prepare data :", err);
  }
};

export const parseBulkSpacesData = async (fileName: string) => {
  try {
    const rows = await extractCSV(fileName);
    const statesData = await getStatesData();
    const amenitiesData = await getAmenitiesData();
    const operatorsData = await getOperatorsData();

    const spaceCountsRes = await getSpaceCountsOfOperator(
      operatorsData.map((op) => op._id.toHexString()),
    );
    for (const key in spaceCountsRes) {
      spaceCounts[key] = spaceCountsRes[key];
    }

    const sluggedRows = rows
      .map((row) => {
        const op = operatorsData.find(
          (op) =>
            op.slug ===
              validifyStringValues(row.operatorslug).trim().toLowerCase() ||
            op.brandName?.trim().toLowerCase().replace(/ +/g, "") ===
              validifyStringValues(row.operatorbrandname)
                .trim()
                .toLowerCase()
                .replace(/ +/g, ""),
        );
        const prepared = prepareData(row, op);
        const data = {
          row,
          prepared,
          operator: op,
        };
        return data;
      })
      .filter((dt) => !!dt.prepared)
      .map((dt, i) => ({
        ...dt.prepared,
        slug: generateSlug(dt.row, i, dt.operator),
      }));

    return sluggedRows;
  } catch (err) {
    console.error("Failed to parse bulk spaces data:", err);
    return null;
  }
};

export const pushBulkSpacesData = async (
  spaces: SpaceSchema[],
  fresh = false,
) => {
  try {
    if (fresh) {
      await Space.deleteMany({});
    }
    // Try pushing data
    const insertedDocs = [] as ModelToRaw<typeof Space>[];
    const insertedErrors = [] as Error[];
    try {
      const insertedRes = await Space.insertMany(
        spaces.filter((sp) => sp.slug),
        { ordered: false, rawResult: true },
      );
      insertedDocs.push(
        ...insertedRes.mongoose.results
          .filter<
            Document<Types.ObjectId, any, ModelToRaw<typeof Space>>
          >((res) => res instanceof Document)
          .map((doc) => doc.toObject()),
      );
      insertedErrors.push(
        ...insertedRes.mongoose.results.filter((res) => res instanceof Error),
      );
    } catch (err) {
      console.log("Failure insert spaces :", err);
    }

    console.log("Bulk inserted :", insertedDocs.length, "/", spaces.length);
    console.log(
      "Bulk inserted errors :",
      insertedErrors.map((err) => err.message),
    );
    const insertedDocsSlugs = insertedDocs.map((doc) => doc.slug);
    const remSpaces = spaces.filter(
      (sp) => !insertedDocsSlugs.includes(sp.slug),
    );

    // Updating remaningSpaces
    console.log(
      "Remaining spaces to update:",
      remSpaces.length,
      "/",
      spaces.length,
    );
    // if (remSpaces.length > 0) {
    //   // Get old data
    //   const oldDocs = await Space.find({
    //     slug: { $in: remSpaces.map((sp) => sp.slug) },
    //   }).lean();

    //   // Cleaning branches data
    //   const updateRes = await Space.bulkWrite(
    //     remSpaces.map((sp) => ({
    //       updateOne: {
    //         filter: { slug: sp.slug },
    //         update: { branches: sp.branches },
    //       },
    //     })),
    //   );
    //   console.log(
    //     "Updated spaces :",
    //     updateRes.modifiedCount,
    //     "/",
    //     remSpaces.length,
    //     "/",
    //     spaces.length,
    //   );
    // }
  } catch (err: any) {
    console.error("Failed to push bulk spaces data:", err);
  }
};
