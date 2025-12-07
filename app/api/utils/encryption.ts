import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const encHash = process.env.ENC_HASH;
  if (!encHash) {
    throw new Error("Variável de ambiente ENC_HASH não está definida");
  }
  const salt = Buffer.from("baby-control-salt");
  return crypto.pbkdf2Sync(encHash, salt, 100000, KEY_LENGTH, "sha256");
}

export function encrypt(text: string): string {
  try {
    if (!text) {
      throw new Error("Texto para criptografar não pode ser vazio");
    }
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(salt);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    const tag = cipher.getAuthTag();
    const combined = `${iv.toString("base64")}:${salt.toString(
      "base64"
    )}:${tag.toString("base64")}:${encrypted}`;
    return combined;
  } catch (error) {
    throw new Error("Falha ao criptografar dados");
  }
}

export function decrypt(encryptedData: string): string {
  try {
    if (!encryptedData) {
      throw new Error("Dados criptografados não podem ser vazios");
    }
    const parts = encryptedData.split(":");
    if (parts.length !== 4) {
      throw new Error("Formato de dados criptografados inválido");
    }
    const [ivBase64, saltBase64, tagBase64, encrypted] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivBase64, "base64");
    const salt = Buffer.from(saltBase64, "base64");
    const tag = Buffer.from(tagBase64, "base64");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    decipher.setAAD(salt);
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    throw new Error("Falha ao descriptografar dados");
  }
}

export function isEncrypted(data: string): boolean {
  if (!data) return false;
  const parts = data.split(":");
  if (parts.length !== 4) return false;
  try {
    Buffer.from(parts[0], "base64");
    Buffer.from(parts[1], "base64");
    Buffer.from(parts[2], "base64");
    return true;
  } catch {
    return false;
  }
}
