import { config } from "dotenv";

config({ path: "./.env" });

export const ENV = process.env;
