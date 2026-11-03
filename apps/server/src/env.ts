import { resolve } from "node:path";

export type Env = {
  databaseUrl: string;
  gmPin: string;
  publicUrl: string;
  port: number;
  webDist: string;
};

export function readEnv(env: Record<string, string | undefined> = process.env): Env {
  const missing = ["DATABASE_URL", "GM_PIN", "PUBLIC_URL"].filter((k) => !env[k]);
  if (missing.length) throw new Error(`Missing env: ${missing.join(", ")}. See .env.example.`);
  const gmPin = env.GM_PIN!;
  if (gmPin.length < 6) throw new Error("GM_PIN must be at least 6 characters.");
  return {
    databaseUrl: env.DATABASE_URL!,
    gmPin,
    publicUrl: env.PUBLIC_URL!.replace(/\/+$/, ""),
    port: Number(env.PORT ?? 3000),
    webDist: resolve(env.WEB_DIST ?? new URL("../../web/dist", import.meta.url).pathname),
  };
}
