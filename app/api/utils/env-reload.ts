import fs from "fs";
import path from "path";

function parseEnvFile(content: string): Record<string, string> {
  const envVars: Record<string, string> = {};
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex === -1) {
      continue;
    }
    const key = trimmed.substring(0, equalIndex).trim();
    let value = trimmed.substring(equalIndex + 1).trim();
    if (!key) {
      continue;
    }
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
      value = value.replace(/\\"/g, '"').replace(/\\'/g, "'");
    }
    envVars[key] = value;
  }
  return envVars;
}

export function reloadEnvFile(envFilePath?: string): boolean {
  try {
    const envPath = envFilePath || path.resolve("./.env");
    if (!fs.existsSync(envPath)) {
      return false;
    }
    const envContent = fs.readFileSync(envPath, "utf-8");
    const envVars = parseEnvFile(envContent);
    let reloadedCount = 0;
    for (const [key, value] of Object.entries(envVars)) {
      process.env[key] = value;
      reloadedCount++;
    }
    return true;
  } catch (error) {
    return false;
  }
}
