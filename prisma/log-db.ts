import { PrismaClient as LogPrismaClient } from "../node_modules/.prisma/log-client";

const logPrisma = new LogPrismaClient();

export default logPrisma;
