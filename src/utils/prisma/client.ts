import "dotenv/config";
// @ts-ignore
import { PrismaClient } from "@root/generated/prisma/client.js";

const prisma = new PrismaClient();

export { prisma };
