import { loadEnv } from "../../src/utils/env";
console.log(process.cwd(), process.env);
// @ts-ignore
const env = loadEnv({ path: "./.env.dev", override: true }).parsed;
import z from "zod";
import {
  AdminSchema,
  userSchema,
  type UserSchema,
} from "../../src/database/schemas/user";
import { User, Admin } from "../../src/database/models/user";
import { encodeCrypto } from "../../src/utils/crypto";
import { Model, MongooseError } from "mongoose";

const data: UserSchema = {
  email: "test@example.com",
  name: "Test User",
  username: "a-user",
  password: encodeCrypto("SomePass@123"),
  isGoogleAcc: false,
  isEmailVerified: false,
  phone: "",
};

const adminData: AdminSchema = {
  email: "admin@gmail.com",
  name: "Root Admin",
  username: "root-admin",
  password: encodeCrypto("SomePass@123"),
  isGoogleAcc: false,
  level: "admin",
  phone: "",
};

const dropColl = async <M extends Model<any>>(model: M) => {
  try {
    await model.deleteMany();
  } catch (err) {
    console.error("Error dropping collection:", err);
  }
};

const testUser = async <T extends Record<string, any>, M extends Model<any>>(
  data: T,
  model: M,
) => {
  try {
    // userSchema.parse(data);
    const doc = new model(data);
    await doc.save();
  } catch (err: any) {
    if (err instanceof z.ZodError || err instanceof MongooseError) {
      console.error("Error validating user data:", err);
    } else {
      console.error("Unexpected error:", err);
    }
  }
};

// await dropColl(User);
// await dropColl(Admin);
// testUser(data, User);
// testUser(adminData, Admin);
Admin.findOne;
