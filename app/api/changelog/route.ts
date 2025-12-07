import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
    if (!fs.existsSync(changelogPath)) {
      return NextResponse.json(
        { error: "Arquivo de changelog não encontrado" },
        { status: 404 }
      );
    }
    const changelogContent = fs.readFileSync(changelogPath, "utf8");
    return NextResponse.json({ conteudo: changelogContent });
  } catch (error) {
    console.error("Erro ao ler changelog:", error);
    return NextResponse.json(
      { error: "Falha ao ler o changelog" },
      { status: 500 }
    );
  }
}
