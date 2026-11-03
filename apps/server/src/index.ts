import { createDb, migrateDb } from "@defuse/db";
import { createApp } from "./app";
import { readEnv } from "./env";
import { createGmAuth } from "./gm-auth";

const env = readEnv();
const db = createDb(env.databaseUrl);
await migrateDb(db);

createApp({ db, gm: createGmAuth(env.gmPin), joinUrl: `${env.publicUrl}/play`, webDist: env.webDist })
  .listen(env.port);

console.log(`Defuse! server on :${env.port}, join URL ${env.publicUrl}/play`);
