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
import { Document, Types } from "mongoose";

const CSVHeaders = {
  OPERATORREGISTEREDNAME: "operatorregisteredname",
  GST: "gst",
  OPERATORBRANDNAME: "operatorbrandname",
  OPERATORHQADDRESS: "operatorhqaddress",
  STATE: "state",
  CITY: "city",
  ZIPPINCODE: "zippincode",
  HQPOCEMAIL: "hqpocemail",
  HQPOCMOBILENO: "hqpocmobileno",
  HQLANDLINECUSTOMERCARENO: "hqlandlinecustomercareno",
  HQPOCNAME: "hqpocname",
  HQPOCDESIGNATION: "hqpocdesignation",
  CIN: "cin",
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

// Get states data
const getStatesData = async () => {
  const states = await State.find({}).lean();
  return states;
};
type StatesData = Awaited<ReturnType<typeof getStatesData>>;

const convertAsPhoneNo = (val: string) => {
  val =
    `+91${validifyStringValues(val?.replace(/ +g/, "").match(/\d{8,10}$/)?.[0]).trim()}`
      .trim()
      .replace(/^[+]91$/, "");
  return val;
};

// Make branch
const getBranchesData = (
  rows: (RowData & { slug: string })[],
  states: StatesData,
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
        email: validifyStringValues(row.hqpocemail) || undefined,
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

const prepareData = (
  row: RowData & { slug: string; branches: BranchSchema[] },
) => {
  try {
    const prepared: Partial<OperatorSchema> = {
      name: validifyStringValues(row.operatorregisteredname),
      brandName: validifyStringValues(row.operatorbrandname),
      email: validifyStringValues(row.hqpocemail),
      slug: row.slug,
      password: encodeCrypto("Pass123@" + row.slug),
      gstNo: validifyStringValues(row.gst),
      cinNo: validifyStringValues(row.cin),
      headquarter: {
        address: validifyStringValues(row.operatorhqaddress),
        contactNo: convertAsPhoneNo(
          validifyStringValues(row.hqlandlinecustomercareno),
        ),
      },
      person: {
        name: validifyStringValues(row.hqpocname) || "Admin",
        email: validifyStringValues(row.hqpocemail),
        role: validifyStringValues(row.hqpocdesignation) || "Admin",
        contactNo: convertAsPhoneNo(validifyStringValues(row.hqpocmobileno)),
      },
      branches: ensureSinglePrimaryBranch(row.branches),
    };
    return prepared;
  } catch (err) {
    console.error("Failed to prepare data :", err);
  }
};

export const parseBulkOperatorsData = async (fileName: string) => {
  try {
    const rows = await extractCSV(fileName);
    const statesData = await getStatesData();
    const sluggedRows = rows
      .map((row) => ({
        ...row,
        slug: generateSlug(row),
      }))
      .reduce(
        (prev, curr, i, self) => {
          const foundInd = prev.findIndex((dt) => dt.slug === curr.slug);

          // Update branches only if found
          if (foundInd >= 0) {
            const branches = removeDuplicateBranches(
              getBranchesData([curr], statesData),
              true,
            );
            prev[foundInd].branches.push(...branches);
          }
          // Add new branches if not found
          else {
            prev.push({
              ...curr,
              branches: removeDuplicateBranches(
                getBranchesData([curr], statesData),
                true,
              ),
            });
          }
          return prev;
        },
        [] as (RowData & { slug: string; branches: BranchSchema[] })[],
      )
      .map((row) => ({
        ...row,
        branches: removeDuplicateBranches(row.branches, true),
      }))
      .map((row) => prepareData(row))
      .filter((row) => !!row);
    return sluggedRows;
  } catch (err) {
    console.error("Failed to parse bulk operators data:", err);
    return null;
  }
};

export const pushBulkOperatorsData = async (
  operators: OperatorSchema[],
  fresh = false,
) => {
  try {
    if (fresh) {
      await Operator.deleteMany({});
    }
    // Try pushing data
    const insertedDocs = [] as ModelToRaw<typeof Operator>[];
    const insertedErrors = [] as Error[];
    try {
      const insertedRes = await Operator.insertMany(
        operators.map((op) => op),
        { ordered: false, rawResult: true },
      );
      insertedDocs.push(
        ...insertedRes.mongoose.results
          .filter<
            Document<Types.ObjectId, any, ModelToRaw<typeof Operator>>
          >((res) => res instanceof Document)
          .map((doc) => doc.toObject()),
      );
      insertedErrors.push(
        ...insertedRes.mongoose.results.filter((res) => res instanceof Error),
      );
    } catch (err) {
      console.log("Failure insert operators :", err);
    }

    console.log("Bulk inserted :", insertedDocs.length, "/", operators.length);
    console.log(
      "Bulk inserted errors :",
      insertedErrors.map((err) => err.message),
    );
    const insertedDocsSlugs = insertedDocs.map((doc) => doc.name);
    const remOperators = operators.filter(
      (op) => !insertedDocsSlugs.includes(op.slug),
    );

    // Updating remaningOperators
    console.log(
      "Remaining operators to update:",
      remOperators.length,
      "/",
      operators.length,
    );
    if (remOperators.length > 0) {
      // Get old data
      const oldDocs = await Operator.find({
        slug: { $in: remOperators.map((op) => op.slug) },
      }).lean();

      // Cleaning branches data
      for (let i = 0; i < remOperators.length; i++) {
        const op = remOperators[i];
        const oldBranches =
          (oldDocs
            .find((doc) => doc.slug === op.slug)
            ?.branches?.map((br) => br) as BranchSchema[]) || [];
        const newBranches = ensureSinglePrimaryBranch(
          removeDuplicateBranches([...oldBranches, ...(op.branches || [])]),
        );
        remOperators[i].branches = newBranches;
      }
      const updateRes = await Operator.bulkWrite(
        remOperators.map((op) => ({
          updateOne: {
            filter: { slug: op.slug },
            update: { branches: op.branches },
          },
        })),
      );
      console.log(
        "Updated operators :",
        updateRes.modifiedCount,
        "/",
        remOperators.length,
        "/",
        operators.length,
      );
    }
  } catch (err: any) {
    console.error("Failed to push bulk operators data:", err);
  }
};
