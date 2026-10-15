import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

/**
 * Segredos guardados no banco (configuração do WhatsApp).
 *
 * Só servidor: importa node:crypto e lê a chave do ambiente. Sem
 * `server-only` porque o cron (tsx, fora do Next) também usa.
 *
 * AES-256-GCM com a chave de SETTINGS_ENCRYPTION_KEY (32 bytes em base64:
 * `openssl rand -base64 32`). Sem ela, nada é cifrado nem decifrado — o banco
 * sozinho não entrega nenhum segredo.
 */

const VERSION = "v1";

function encryptionKey(): Buffer {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY não configurada: gere com `openssl rand -base64 32`",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("SETTINGS_ENCRYPTION_KEY precisa ter 32 bytes em base64");
  }
  return key;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const content = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return [
    VERSION,
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    content.toString("base64"),
  ].join(":");
}

export function decryptSecret(encoded: string): string {
  const [version, iv, tag, content] = encoded.split(":");
  if (version !== VERSION || !iv || !tag || !content) {
    throw new Error("Segredo em formato desconhecido");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(content, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** SHA-256 em hex: para chave aleatória e longa, que só precisa ser conferida. */
export const hashSecret = (value: string) =>
  createHash("sha256").update(value).digest("hex");

/** Compara dois hashes sem vazar pelo tempo. */
export function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** "wai_…a1b2": o suficiente para reconhecer a chave, nunca para usá-la. */
export function maskSecret(value: string): string {
  const prefix = value.includes("_") ? `${value.split("_")[0]}_` : "";
  return `${prefix}…${value.slice(-4)}`;
}
