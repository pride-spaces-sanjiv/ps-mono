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
import { spaceSchema, SpaceSchema } from "@/database/schemas/space.js";
import moment from "moment";
import { getSpaceCountsOfOperator } from "@/utils/mongoose/relations/space-operator.js";
import { SpaceGrade, SpaceType } from "@/utils/data/spaceTypes.js";
import {
  CSVHeaders,
  CSVHeadersValues,
  RowData,
} from "../data/space-headers.js";
import { Readable } from "stream";
import { generateSpaceKeyword } from "@/utils/data/name-keyword.js";
import { areasUpdateMQ } from "@/utils/services/rabbitmq/rabbitmq.js";

// Objects
const spaceCounts = {} as Record<string, number>;

export const extractCSV = (csvFile: string | Readable) => {
  const rows: RowData[] = [];
  const stream =
    typeof csvFile === "string"
      ? fs.createReadStream(path.resolve(csvFile))
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
  const val: SpaceGrade =
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
  const val: SpaceType =
    (str.includes(`flex`) && str.includes("mos")) || str.includes("hybrid")
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
  const val: SpaceSchema["specs"]["category"] = str.includes(`elite`)
    ? "Elite"
    : str.includes(`apex`)
      ? "Apex"
      : str.includes(`classic`)
        ? "Classic"
        : "Starter";
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
    vo:
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
            // return `${height * 300}x${width * 300}`;
          }
          return `${height}x${width}`;
        }
        return "";
      })
      .filter((s) => s) || [];
  return sizes as SpaceSchema["specs"]["workingSizes"];
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
  // const parsedMoments = ["MM-YYYY", "YYYY-MM", "MM/YYYY", "YYYY/MM"].map(
  //   (format) => moment(str, format, true).date(15),
  // );
  // const date = parsedMoments.find((d) => d.isValid());
  // if (date) {
  //   return date.toDate();
  // }
  const yr = Number(validifyStringValues(str).replace(/[^0-9]/g, ""));
  if (
    !Number.isNaN(yr) &&
    Number.isInteger(yr) &&
    yr >= 1800 &&
    yr <= new Date().getFullYear()
  ) {
    return yr;
  }
  return undefined;
};

// Sub schema fields gen
const generateSpecsData = (row: RowData) => {
  const specs: SpaceSchema["specs"] = {
    category: generateCategory(row.category),
    spaceType: generateSpaceType(row.spacetype),
    grade: generateGrade(row.buildingtype),
    area:
      Number(
        validifyStringValues(row.centreareainsqftapprox)
          .replace(/[^0-9\.]/g, "")
          .match(/[0-9]+\.?[0-9]*/)?.[0]
          ?.replace(/(\.+)$/g, ""),
      ) || undefined,
    workingSizes: generateWorkSizes(row.workstationsize),
  };
  return specs;
};

const generateTimingData = (row: RowData) => {
  const data: SpaceSchema["timing"] = {
    // Create a util to generate from open days
    openDays: Array(6)
      .fill(false)
      .map((_, i) => i + 1),
    openTime: generateTimedDate(row.openingtime),
    closeTime: generateTimedDate(row.closingtime),
    operationalSince: generateOperationalSince(row.operationalsinceyear),
    operationalHrs: 12,
  };
  return data;
};

const generateSeatsData = (row: RowData) => {
  const totalSeats =
    Number(validifyStringValues(row.totalseats).replace(/[^0-9]/g, "")) || 0;
  const availableSeats = Number(
    validifyStringValues(row.availableseats).replace(/[^0-9]/g, ""),
  );
  const data: SpaceSchema["seats"] = {
    total: totalSeats,
    booked: Math.max(0, totalSeats - availableSeats),
  };
  return data;
};

const generateFlagsData = (row: RowData) => {
  const grade = generateGrade(row.buildingtype);
  const data: SpaceSchema["flags"] = {
    isOc:
      grade === "B"
        ? validifyStringValues(row.ocnonoc)
            .trim()
            .toLowerCase()
            ?.match(/(oc|yes)/)
          ? true
          : false
        : true,
    isSez:
      grade === "B"
        ? false
        : validifyStringValues(row.seznonsez)
              .trim()
              .toLowerCase()
              ?.match(/(sez|yes)/)
          ? true
          : false,
    isVerified: false,
    isActive: true,
  };
  return data;
};

// Space counts updation
const updateSpaceCounts = async (
  operatorsData: Awaited<ReturnType<typeof getOperatorsData>>,
  reset = false,
) => {
  const spaceCountsRes = await getSpaceCountsOfOperator(
    operatorsData.map((op) => op._id.toHexString()),
  );
  // console.log(
  //   "Spaces count res :",
  //   spaceCountsRes,
  //   "from operators ->",
  //   operatorsData.length,
  // );
  const spaceCounts = {} as Record<string, number>;
  for (const key in spaceCountsRes) {
    const val = reset ? 0 : spaceCountsRes[key];
    spaceCounts[key] = val;
    // console.log("Updating count of spaces for operator :", {
    //   operator: key,
    //   count: val,
    //   updatedVal: spaceCounts[key],
    // });
  }
  return spaceCounts;
};

const prepareData = (row: RowData, operator?: OperatorsData[number]) => {
  try {
    const opPerson =
      operator?.branches.find((br) => br.isPrimary)?.person || operator?.person;
    const prepared: Partial<SpaceSchema & { fullKeyword?: string }> = {
      operator: operator?._id.toHexString() || "",
      name: validifyStringValues(row.centrename),
      // @ts-ignore
      fullKeyword:
        generateSpaceKeyword(validifyStringValues(row.centrename)) || undefined,
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
        url:
          spaceSchema.shape.location.shape.url
            .safeParse(row.locationurl)
            .data?.trim() || undefined,
      },
      specs: generateSpecsData(row),
      timing: generateTimingData(row),
      seats: generateSeatsData(row),
      pricing: generatePricing(row),
      flags: generateFlagsData(row),
    };
    return prepared;
  } catch (err) {
    console.error("Failed to prepare data :", err);
  }
};

export const parseBulkSpacesData = async (
  rows: RowData[],
  options: Partial<{
    postModification: Parameters<
      (ReturnType<typeof prepareData> & { slug: string })[]["map"]
    >[0];
    postFilter: Parameters<
      (ReturnType<typeof prepareData> & { slug: string })[]["filter"]
    >[0];
    preFilter: Parameters<RowData[]["filter"]>[0];
  }> = {},
) => {
  try {
    const statesData = await getStatesData();
    const amenitiesData = await getAmenitiesData();
    const operatorsData = await getOperatorsData();

    await updateSpaceCounts(operatorsData);

    const sluggedRows = rows
      .filter(options?.preFilter || ((row) => true))
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
      }))
      .filter(options?.postFilter || ((x) => true))
      .map(options?.postModification || ((x) => x));

    return sluggedRows;
  } catch (err) {
    console.error("Failed to parse bulk spaces data:", err);
    return null;
  }
};

export const pushBulkSpacesData = async (
  spaces: (SpaceSchema & { fullKeyword?: string })[],
  fresh = false,
) => {
  const stats = {
    total: 0,
    success: 0,
    inserted: 0,
    updated: 0,
    failed: 0,
  };
  try {
    if (fresh) {
      const delRes = await Space.deleteMany({});
      console.log("Deleted spaces :", delRes.deletedCount);
    }
    stats.total = spaces.length;

    // Cities-Areas data
    try {
      areasUpdateMQ.sendMessage({
        pairs: spaces
          .map((sp) => ({
            city: sp?.location?.city?.trim(),
            area: sp?.location?.area?.trim(),
          }))
          .filter((p) => p.city.trim() && p.area.trim()),
      });
    } catch (err) {}

    // Space counts realtime update
    const operatorsData = await getOperatorsData();
    console.log("Fresh data :", fresh);
    const spaceCounts = await updateSpaceCounts(operatorsData, fresh);
    console.log("Space counts :", spaceCounts);

    // Rewrite slugs
    for (let i = 0; i < spaces.length; i++) {
      const spaceEl = spaces[i];
      const prevSpacesCount = spaceCounts[spaceEl.operator] || 0;
      spaceCounts[spaceEl.operator] = prevSpacesCount + 1;
      // console.log("Current spaces in operator :", spaceEl.operator, {
      //   count: spaceCounts[spaceEl.operator],
      // });
      spaces[i].slug = spaceEl.slug.replace(
        /\-[0-9]+$/,
        `-${String(spaceCounts[spaceEl.operator]).padStart(4, "0000")}`,
      );
    }

    // Try pushing data
    const insertedDocs = [] as ModelToRaw<typeof Space>[];
    const insertedErrors = [] as Error[];
    try {
      // Keyword founds
      const existings = (
        await Space.find({
          fullKeyword: {
            $in: spaces
              .map((sp) => sp.fullKeyword)
              .filter((v): v is string => !!v),
          },
        })
      ).map((doc) => doc.fullKeyword);
      const forInsertSpaces = spaces.filter(
        (sp) => sp.fullKeyword && !existings.includes(sp.fullKeyword),
      );

      const insertedRes = await Space.insertMany(
        forInsertSpaces.filter((sp) => sp.slug),
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

    let updatedCount = 0;
    if (remSpaces.length > 0) {
      // // Get old data
      // const oldDocs = await Space.find({
      //   fullKeyword: { $in: remSpaces.map((sp) => sp.fullKeyword) },
      // }).lean();

      // Cleaning branches data
      const updateRes = await Space.bulkWrite(
        remSpaces.map((sp) => ({
          updateOne: {
            filter: { fullKeyword: sp.fullKeyword },
            update: { ...sp, slug: undefined },
          },
        })),
      );
      updatedCount = updateRes.modifiedCount;
      console.log(
        "Updated spaces :",
        updateRes.modifiedCount,
        "/",
        remSpaces.length,
        "/",
        spaces.length,
      );
    }
    stats.success = insertedDocs.length + updatedCount;
    stats.inserted = insertedDocs.length;
    stats.updated = updatedCount;
    stats.failed = remSpaces.length - updatedCount;
    // return stats;
  } catch (err: any) {
    console.error("Failed to push bulk spaces data:", err);
    // return null;
  }
  return stats;
};
