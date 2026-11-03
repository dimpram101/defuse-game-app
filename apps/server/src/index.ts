import { createDb, migrateDb } from "@defuse/db";
import { createApp } from "./app";
import { readEnv } from "./env";
import { createGmAuth } from "./gm-auth";
import { LiveGame } from "./live";

const env = readEnv();
const db = createDb(env.databaseUrl);
await migrateDb(db);

const gm = createGmAuth(env.gmPin);
const joinUrl = `${env.publicUrl}/play`;
const live = new LiveGame(db, gm, joinUrl);
await live.init();

createApp({ db, gm, live, joinUrl, webDist: env.webDist }).listen(env.port);

console.log(`Defuse! server on :${env.port}, join URL ${env.publicUrl}/play`);
