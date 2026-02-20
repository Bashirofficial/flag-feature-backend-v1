import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const connectDB = async () => {
  await prisma.$connect();
  console.log("✅ Database connected");
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
  console.log("🛑 Database disconnected");
};

export default prisma;
