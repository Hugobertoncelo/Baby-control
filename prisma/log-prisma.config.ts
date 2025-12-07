// Prisma 7 config does not require any import. Use plain object export.
export default {
  datasource: {
    provider: "sqlite",
    url: "file:../db/baby-control.db",
  },
};
