import { loadEnv } from "../../src/utils/env";
console.log(process.cwd(), process.env);
// @ts-ignore
const env = loadEnv({ path: "./.env.dev", override: true }).parsed;
import z from "zod";
import { userSchema, type UserSchema } from "../../src/database/schemas/user";
import { User, Admin } from "../../src/database/models/user";
import { MongooseError } from "mongoose";

const data: UserSchema = {
  email: "test@example.com",
  name: "Test User",
  username: "a-user",
  password: "SomePass@123",
  isGoogleAcc: false,
  isEmailVerified: false,
  phone: "",
};

const testUser = async () => {
  try {
    // userSchema.parse(data);
    const doc = new User(data);
    await doc.save();
  } catch (err: any) {
    if (err instanceof z.ZodError || err instanceof MongooseError) {
      console.error("Error validating user data:", err);
    } else {
      console.error("Unexpected error:", err);
    }
  }
};
testUser();
