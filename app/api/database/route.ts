import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import JSZip from "jszip";
import prisma from "../db";
import { withSysAdminAuth, ApiResponse } from "../utils/auth";
import { reloadEnvFile } from "../utils/env-reload";

async function disconnectPrisma() {
  await prisma.$disconnect();
}

async function getHandler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    await disconnectPrisma();
    const dbPath = path.resolve("./db/baby-control.db");
    const envPath = path.resolve("./.env");
    const dateStr = new Date().toISOString().split("T")[0];
    const dbContent = await fs.promises.readFile(dbPath);
    const envContent = await fs.promises.readFile(envPath, "utf-8");
    const zip = new JSZip();
    zip.file("baby-control.db", dbContent);
    zip.file(`${dateStr}.backup.env`, envContent);
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const response = new NextResponse(zipBuffer as any);
    response.headers.set("Content-Type", "application/zip");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="baby-control-backup-${dateStr}.zip"`
    );
    return response as unknown as NextResponse<ApiResponse<any>>;
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha ao criar backup",
      },
      { status: 500 }
    );
  }
}

async function postHandler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    await disconnectPrisma();
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Nenhum arquivo fornecido",
        },
        { status: 400 }
      );
    }
    const dbPath = path.resolve("./db/baby-control.db");
    const envPath = path.resolve("./.env");
    const dateStr = new Date().toISOString().split("T")[0];
    const buffer = Buffer.from(await file.arrayBuffer());
    const isZipFile = file.name.endsWith(".zip");
    if (isZipFile) {
      try {
        const zip = await JSZip.loadAsync(buffer);
        const dbFile = zip.file("baby-control.db");
        if (!dbFile) {
          return NextResponse.json<ApiResponse<null>>(
            {
              success: false,
              error: "Arquivo do banco de dados não encontrado no zip",
            },
            { status: 400 }
          );
        }
        const dbContent = await dbFile.async("nodebuffer");
        if (!dbContent.toString("utf8", 0, 16).includes("SQLite")) {
          return NextResponse.json<ApiResponse<null>>(
            {
              success: false,
              error: "Arquivo de banco de dados inválido no zip",
            },
            { status: 400 }
          );
        }
        const envFiles = Object.keys(zip.files).filter((name) =>
          name.endsWith(".backup.env")
        );
        let envContent: string | null = null;
        if (envFiles.length > 0) {
          const envFile = zip.file(envFiles[0]);
          if (envFile) {
            envContent = await envFile.async("string");
          }
        }
        const backupPath = `${dbPath}.backup-${dateStr}`;
        await fs.promises.copyFile(dbPath, backupPath);
        const envBackupPath = `${envPath}.backup-${dateStr}`;
        if (
          await fs.promises
            .access(envPath)
            .then(() => true)
            .catch(() => false)
        ) {
          await fs.promises.copyFile(envPath, envBackupPath);
        }
        await fs.promises.writeFile(dbPath, dbContent);
        if (envContent) {
          await fs.promises.writeFile(envPath, envContent);
          reloadEnvFile(envPath);
        }
        return NextResponse.json<ApiResponse<null>>({ success: true });
      } catch (zipError) {
        console.error("Zip extraction error:", zipError);
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "Falha ao extrair o arquivo zip",
          },
          { status: 400 }
        );
      }
    } else {
      if (!buffer.toString("utf8", 0, 16).includes("SQLite")) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "Arquivo de banco de dados inválido",
          },
          { status: 400 }
        );
      }
      const backupPath = `${dbPath}.backup-${dateStr}`;
      await fs.promises.copyFile(dbPath, backupPath);
      await fs.promises.writeFile(dbPath, buffer);
      return NextResponse.json<ApiResponse<null>>({ success: true });
    }
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha ao restaurar backup",
      },
      { status: 500 }
    );
  }
}

export const GET = withSysAdminAuth(getHandler);
export const POST = withSysAdminAuth(postHandler);
