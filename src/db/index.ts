import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { connectRedis, closeRedis } from "../config/redis";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const connectDB = async () => {
  await prisma.$connect();
  await connectRedis();
  console.log("✅ Database and Redis connected");
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
  await closeRedis();
  console.log("🛑 Database and Redis disconnected");
};

export default prisma;
