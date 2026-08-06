import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
dotenv.config();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("POSTGRESQL DB IS CONNECTED !!!");
  } catch (error) {
    console.log("DATABASE CONNECTION FAILED !!!", error);
    process.exit(1);
  }
};

export { prisma };
export default connectDB;