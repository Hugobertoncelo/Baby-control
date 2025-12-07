import crypto from "crypto";

const HASH_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!password) {
      reject(new Error("A senha não pode ser vazia"));
      return;
    }
    const salt = crypto.randomBytes(SALT_LENGTH);
    crypto.pbkdf2(
      password,
      salt,
      HASH_ITERATIONS,
      KEY_LENGTH,
      "sha256",
      (err, derivedKey) => {
        if (err) {
          reject(new Error("Falha ao gerar hash da senha"));
          return;
        }
        const saltBase64 = salt.toString("base64");
        const hashBase64 = derivedKey.toString("base64");
        const hashedPassword = `${saltBase64}:${hashBase64}`;
        resolve(hashedPassword);
      }
    );
  });
}

export function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!password || !hashedPassword) {
      resolve(false);
      return;
    }
    try {
      const parts = hashedPassword.split(":");
      if (parts.length !== 2) {
        resolve(false);
        return;
      }
      const [saltBase64, hashBase64] = parts;
      const salt = Buffer.from(saltBase64, "base64");
      crypto.pbkdf2(
        password,
        salt,
        HASH_ITERATIONS,
        KEY_LENGTH,
        "sha256",
        (err, derivedKey) => {
          if (err) {
            reject(new Error("Falha ao verificar senha"));
            return;
          }
          const providedHashBase64 = derivedKey.toString("base64");
          const isMatch = crypto.timingSafeEqual(
            Buffer.from(hashBase64, "base64"),
            Buffer.from(providedHashBase64, "base64")
          );
          resolve(isMatch);
        }
      );
    } catch (error) {
      resolve(false);
    }
  });
}

export function hashPasswordSync(password: string): string {
  if (!password) {
    throw new Error("A senha não pode ser vazia");
  }
  const salt = crypto.randomBytes(SALT_LENGTH);
  const derivedKey = crypto.pbkdf2Sync(
    password,
    salt,
    HASH_ITERATIONS,
    KEY_LENGTH,
    "sha256"
  );
  const saltBase64 = salt.toString("base64");
  const hashBase64 = derivedKey.toString("base64");
  return `${saltBase64}:${hashBase64}`;
}

export function verifyPasswordSync(
  password: string,
  hashedPassword: string
): boolean {
  if (!password || !hashedPassword) {
    return false;
  }
  try {
    const parts = hashedPassword.split(":");
    if (parts.length !== 2) {
      return false;
    }
    const [saltBase64, hashBase64] = parts;
    const salt = Buffer.from(saltBase64, "base64");
    const derivedKey = crypto.pbkdf2Sync(
      password,
      salt,
      HASH_ITERATIONS,
      KEY_LENGTH,
      "sha256"
    );
    const providedHashBase64 = derivedKey.toString("base64");
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(hashBase64, "base64"),
      Buffer.from(providedHashBase64, "base64")
    );
    return isMatch;
  } catch (error) {
    return false;
  }
}
