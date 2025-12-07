import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import JSZip from "jszip";
import prisma from "../../db";
import { withAuthContext, ApiResponse, AuthResult } from "../../utils/auth";
import { reloadEnvFile } from "../../utils/env-reload";

async function desconectarPrisma() {
  await prisma.$disconnect();
}

async function manipulador(
  request: NextRequest,
  contextoAutenticacao: AuthResult
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    await desconectarPrisma();

    const formData = await request.formData();
    const arquivo = formData.get("file") as File;

    if (!arquivo) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Nenhum arquivo fornecido",
        },
        { status: 400 }
      );
    }

    const caminhoDb = path.resolve("./db/baby-control.db");
    const caminhoEnv = path.resolve("./.env");
    const dataStr = new Date().toISOString().split("T")[0];

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const ehZip = arquivo.name.endsWith(".zip");

    if (ehZip) {
      try {
        const zip = await JSZip.loadAsync(buffer);
        const arquivoDb = zip.file("baby-control.db");
        if (!arquivoDb) {
          return NextResponse.json<ApiResponse<null>>(
            {
              success: false,
              error: "Arquivo de banco de dados não encontrado no zip",
            },
            { status: 400 }
          );
        }
        const conteudoDb = await arquivoDb.async("nodebuffer");
        if (!conteudoDb.toString("utf8", 0, 16).includes("SQLite")) {
          return NextResponse.json<ApiResponse<null>>(
            {
              success: false,
              error: "Arquivo de banco de dados inválido no zip",
            },
            { status: 400 }
          );
        }
        const arquivosEnv = Object.keys(zip.files).filter((nome) =>
          nome.endsWith(".backup.env")
        );
        let conteudoEnv: string | null = null;
        if (arquivosEnv.length > 0) {
          const arquivoEnv = zip.file(arquivosEnv[0]);
          if (arquivoEnv) {
            conteudoEnv = await arquivoEnv.async("string");
          }
        }
        if (fs.existsSync(caminhoDb)) {
          const caminhoBackup = `${caminhoDb}.backup-${dataStr}`;
          await fs.promises.copyFile(caminhoDb, caminhoBackup);
        }
        if (conteudoEnv && fs.existsSync(caminhoEnv)) {
          const caminhoEnvBackup = `${caminhoEnv}.backup-${dataStr}`;
          await fs.promises.copyFile(caminhoEnv, caminhoEnvBackup);
        }
        await fs.promises.writeFile(caminhoDb, conteudoDb);
        if (conteudoEnv) {
          await fs.promises.writeFile(caminhoEnv, conteudoEnv);
          reloadEnvFile(caminhoEnv);
        }
        return NextResponse.json<ApiResponse<null>>({
          success: true,
          data: null,
        });
      } catch (erroZip) {
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
            error:
              "Arquivo de banco de dados inválido - deve ser SQLite válido",
          },
          { status: 400 }
        );
      }
      if (fs.existsSync(caminhoDb)) {
        const caminhoBackup = `${caminhoDb}.backup-${dataStr}`;
        await fs.promises.copyFile(caminhoDb, caminhoBackup);
      }
      await fs.promises.writeFile(caminhoDb, buffer);
      return NextResponse.json<ApiResponse<null>>({
        success: true,
        data: null,
      });
    }
  } catch (erro) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error:
          erro instanceof Error
            ? erro.message
            : "Falha ao restaurar backup na configuração inicial",
      },
      { status: 500 }
    );
  }
}

export const POST = withAuthContext(manipulador);
