import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withSysAdminAuth, ApiResponse } from "../../utils/auth";

const TARGET_MIGRATION = "20250807141402_add_feedback_model";

interface PreMigrationCheckResult {
  adminResetRequired: boolean;
  latestMigration: string | null;
  isOlderDatabase: boolean;
}

async function checkHandler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<PreMigrationCheckResult>>> {
  let tempPrisma: PrismaClient | null = null;

  try {
    process.env.DATABASE_URL = "file:../db/baby-control.db";
    tempPrisma = new PrismaClient();

    const latestMigration = await tempPrisma.$queryRaw<
      Array<{ migration_name: string; finished_at: string }>
    >`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      ORDER BY finished_at DESC
      LIMIT 1
    `;

    let adminResetRequired = false;
    let isOlderDatabase = false;
    let latestMigrationName: string | null = null;

    if (latestMigration && latestMigration.length > 0) {
      latestMigrationName = latestMigration[0].migration_name;
      const latestMigrationDate = latestMigrationName.substring(0, 14);
      const targetMigrationDate = TARGET_MIGRATION.substring(0, 14);
      isOlderDatabase = latestMigrationDate <= targetMigrationDate;
      adminResetRequired = isOlderDatabase;
      if (adminResetRequired) {
        await tempPrisma.$executeRaw`
          UPDATE AppConfig SET adminPass = ''
        `;
      }
    } else {
      latestMigrationName = null;
      isOlderDatabase = false;
      adminResetRequired = false;
    }

    await tempPrisma.$disconnect();

    return NextResponse.json<ApiResponse<PreMigrationCheckResult>>({
      success: true,
      data: {
        adminResetRequired,
        latestMigration: latestMigrationName,
        isOlderDatabase,
      },
    });
  } catch (error) {
    if (tempPrisma) {
      try {
        await tempPrisma.$disconnect();
      } catch (disconnectError) {}
    }
    return NextResponse.json<ApiResponse<PreMigrationCheckResult>>(
      {
        success: false,
        error: "Falha ao realizar a verificação pré-migração",
        data: {
          adminResetRequired: false,
          latestMigration: null,
          isOlderDatabase: false,
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withSysAdminAuth(checkHandler);
