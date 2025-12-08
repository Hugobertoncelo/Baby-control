import { PrismaClient as LogPrismaClient } from ".prisma/log-client";

let logPrisma: LogPrismaClient;

if (process.env.NODE_ENV === "production") {
  logPrisma = new LogPrismaClient({
    log: ["error"],
  });
} else {
  if (!(global as any).logPrisma) {
    (global as any).logPrisma = new LogPrismaClient({
      log: ["error"],
    });
  }
  logPrisma = (global as any).logPrisma;
}

const handleShutdown = async () => {
  try {
    await logPrisma.$disconnect();
  } catch (error) {
    console.error("Error disconnecting from log database:", error);
  }
};

process.once("beforeExit", handleShutdown);
process.once("SIGTERM", handleShutdown);
process.once("SIGINT", handleShutdown);

export default logPrisma;
