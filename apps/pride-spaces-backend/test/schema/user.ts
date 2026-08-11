import z from "zod";
import { userSchema, type UserSchema } from "../../src/database/schemas/user";

const data: UserSchema = {
  email: "test@example.com",
  name: "Test User",
  username: "a-user",
  password: "SomePass@123",
  isGoogleAcc: false,
  isEmailVerified: false,
  phone: "",
};

try {
  userSchema.parse(data);
} catch (err: any) {
  if (err instanceof z.ZodError) {
    console.error("Error validating user data:", err);
  } else {
    console.error("Unexpected error:", err);
  }
}
