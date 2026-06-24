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
const generateSlug = (row: RowData) => {
  const slug =
    (row.operatorbrandname?.trim() || row.operatorregisteredname?.trim())
      ?.toLowerCase()
      .replace(/( |[^A-z0-9])+/g, "-") || "";
  return !invalidValues.includes(slug as (typeof invalidValues)[number])
    ? slug
    : "";
};

const generateSlugs = (rows: RowData[]) => {
  const slugs = rows
    .map((dt) => generateSlug(dt))
    .filter((slug): slug is string => !!slug);
  return {
    slugs,
    metrics: { slugsCount: slugs.length, originalCount: rows.length },
  };
};

const convertAsPhoneNo = (val: string) => {
  val =
    `+91${validifyStringValues(val?.replace(/[^0-9]+/g, "").match(/\d{8,10}$/)?.[0]).trim()}`
      .trim()
      .replace(/^[+]91$/, "");
  return val;
};

// Make branch
const getBranchesData = (
  rows: (RowData & { slug: string })[],
  states: StatesData,
  amenities: AmenitiesData,
) => {
  const branches = rows
    .map((row) => ({
      code:
        states.find(
          (st) =>
            st.name.trim().toLowerCase() === row.state?.trim().toLowerCase(),
        )?.code || "",
      name: validifyStringValues(row.state),
      city: validifyStringValues(row.city),
      postalCode: validifyStringValues(row.zippincode),
      address: validifyStringValues(row.operatorhqaddress),
      isPrimary: true,
      gstNo: validifyStringValues(row.gst),
      person: {
        name: validifyStringValues(row.hqpocname) || undefined,
        email:
          validifyStringValues(row.hqpocemail || row.hqemailforloginid) ||
          undefined,
        role: validifyStringValues(row.hqpocdesignation) || undefined,
        contactNo: convertAsPhoneNo(validifyStringValues(row.hqpocmobileno)),
      },
    }))
    .filter((br) => br.code.trim());
  return branches;
};

const removeDuplicateBranches = (
  branches: BranchSchema[],
  storeLatest = false,
) => {
  const unique = (storeLatest ? branches.toReversed() : branches).reduce(
    (prev, curr, i, self) => {
      if (!prev.some((br) => br.code === curr.code)) {
        prev.push(curr);
      }
      return prev;
    },
    [] as BranchSchema[],
  );
  return unique;
};

const ensureSinglePrimaryBranch = (branches: BranchSchema[]) => {
  let ensured = [...branches];

  // If no primary
  if (branches.filter((br) => br.isPrimary).length < 1 && branches.length > 0) {
    ensured[0] = { ...ensured[0], isPrimary: true };
  }
  // If more than 1 primary found
  if (branches.filter((br) => br.isPrimary).length > 1) {
    const firstPrimaryInd = branches.findIndex((br) => br.isPrimary);
    ensured = ensured.map((br, i) => ({
      ...br,
      isPrimary: i === firstPrimaryInd,
    }));
  }
  return ensured;
};

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

const prepareData = (row: RowData, operator?: OperatorsData[number]) => {
  try {
    const opPerson =
      operator?.branches.find((br) => br.isPrimary)?.person || operator?.person;
    const prepared: Partial<SpaceSchema> = {
      name: validifyStringValues(row.centrename),
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
          validifyStringValues(row.address).match(/ ([0-9]{6}) /)?.[1] || "",
        country: "India",
        lat: 0,
        lng: 0,
      },
      // Create a util to generate from open days
      openDays: Array(6)
        .fill(false)
        .map((_, i) => i + 1),
      openTime: moment(row.openingtime, "hh:mm", true).isValid()
        ? moment(row.openingtime, "hh:mm", true).toDate()
        : undefined,
      closeTime: moment(row.closingtime, "hh:mm", true).isValid()
        ? moment(row.closingtime, "hh:mm", true).toDate()
        : undefined,
      grade: generateGrade(row.buildinggrade),
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

    const sluggedRows = rows
      .map((row) => ({
        ...row,
        // slug: generateSlug(row),
      }))
      .map((row) => prepareData(row))
      .filter((row) => !!row);
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
        spaces.map((sp) => sp),
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
    const insertedDocsSlugs = insertedDocs.map((doc) => doc.name);
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
    if (remSpaces.length > 0) {
      // Get old data
      const oldDocs = await Space.find({
        slug: { $in: remSpaces.map((sp) => sp.slug) },
      }).lean();

      // Cleaning branches data
      for (let i = 0; i < remSpaces.length; i++) {
        const sp = remSpaces[i];
        const oldBranches =
          (oldDocs
            .find((doc) => doc.slug === sp.slug)
            ?.branches?.map((br) => br) as BranchSchema[]) || [];
        const newBranches = ensureSinglePrimaryBranch(
          removeDuplicateBranches([...oldBranches, ...(sp.branches || [])]),
        );
        remSpaces[i].branches = newBranches;
      }
      const updateRes = await Space.bulkWrite(
        remSpaces.map((sp) => ({
          updateOne: {
            filter: { slug: sp.slug },
            update: { branches: sp.branches },
          },
        })),
      );
      console.log(
        "Updated spaces :",
        updateRes.modifiedCount,
        "/",
        remSpaces.length,
        "/",
        spaces.length,
      );
    }
  } catch (err: any) {
    console.error("Failed to push bulk spaces data:", err);
  }
};
