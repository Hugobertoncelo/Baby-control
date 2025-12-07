import { PrismaClient, Prisma } from "@prisma/client";

const logLevels: Prisma.LogLevel[] =
  process.env.NODE_ENV === "development"
    ? ["query", "info", "warn", "error"]
    : ["error"];

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    log: logLevels.map((level) => ({
      emit: "stdout",
      level,
    })),
  });
} else {
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient({
      log: logLevels.map((level) => ({
        emit: "stdout",
        level,
      })),
    });
  }
  prisma = (global as any).prisma;
}

const handleShutdown = async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("Erro ao desconectar do banco de dados:", error);
  }
};

process.removeAllListeners("beforeExit");
process.removeAllListeners("SIGTERM");
process.removeAllListeners("SIGINT");

process.once("beforeExit", handleShutdown);
process.once("SIGTERM", handleShutdown);
process.once("SIGINT", handleShutdown);

export default prisma;
