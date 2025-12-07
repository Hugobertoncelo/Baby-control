import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { withAuthContext, ApiResponse, AuthResult } from "../../utils/auth";

const execAsync = promisify(exec);

async function handler(
  request: NextRequest,
  authContext: AuthResult
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    console.log("Iniciando migração inicial do banco de dados...");
    const projectRoot = process.cwd();
    const scriptsDir = path.join(projectRoot, "scripts");
    console.log("Etapa 1: Gerando cliente Prisma...");
    try {
      await execAsync("npm run prisma:generate", { cwd: projectRoot });
      console.log("✓ Cliente Prisma gerado com sucesso");
    } catch (error) {
      console.error("✗ Falha ao gerar cliente Prisma:", error);
      throw new Error(
        "Falha ao gerar o cliente Prisma. Isso pode indicar um problema no schema."
      );
    }
    console.log("Etapa 2: Executando migrações do schema do banco de dados...");
    try {
      await execAsync("npx prisma migrate deploy", { cwd: projectRoot });
      console.log(
        "✓ Migrações do schema do banco de dados concluídas com sucesso"
      );
    } catch (error) {
      console.error(
        "✗ Falha nas migrações do schema do banco de dados:",
        error
      );
      try {
        console.log("Tentando migração de desenvolvimento como alternativa...");
        await execAsync("npm run prisma:migrate", { cwd: projectRoot });
        console.log("✓ Migração de desenvolvimento concluída com sucesso");
      } catch (devError) {
        console.error("✗ Migração de desenvolvimento também falhou:", devError);
        throw new Error(
          "Falha ao executar migrações do banco de dados. O schema pode estar incompatível."
        );
      }
    }
    console.log("Etapa 3: Verificando migração de dados da família...");
    try {
      const familyMigrationScript = path.join(
        scriptsDir,
        "family-migration.js"
      );
      await execAsync(`node "${familyMigrationScript}"`, { cwd: projectRoot });
      console.log("✓ Migração de dados da família concluída com sucesso");
    } catch (error) {
      console.error("⚠ Falha na migração de dados da família:", error);
      console.warn(
        "Migração da família ignorada - pode não ser necessária para esta versão do banco de dados"
      );
    }
    console.log(
      "Etapa 4: Atualizando banco de dados com configurações e unidades mais recentes..."
    );
    try {
      await execAsync("npm run prisma:seed", { cwd: projectRoot });
      console.log("✓ População do banco de dados concluída com sucesso");
    } catch (error) {
      console.error("✗ Falha ao popular banco de dados:", error);
      throw new Error(
        "Falha ao popular o banco de dados com dados padrão. Alguns recursos podem não funcionar corretamente."
      );
    }
    console.log("🎉 Migração inicial concluída com sucesso!");
    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        message: "Banco de dados migrado com sucesso para configuração inicial",
        steps: [
          "Cliente Prisma gerado",
          "Migrações do schema aplicadas",
          "Estrutura de dados da família atualizada",
          "Configurações e unidades padrão adicionadas",
        ],
      },
    });
  } catch (error) {
    console.error("💥 Falha na migração inicial:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: `${
          error instanceof Error ? error.message : "Falha na migração"
        }. Você pode precisar usar um backup diferente ou rodar scripts de migração manualmente.`,
        data: null,
      },
      { status: 500 }
    );
  }
}

export const POST = withAuthContext(handler);
