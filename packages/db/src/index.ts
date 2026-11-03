import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import * as schema from "./schema";

export * as schema from "./schema";
export * from "drizzle-orm";

export function createDb(url: string) {
  const client = new SQL(url);
  return Object.assign(drizzle({ client, schema }), { close: () => client.close() });
}
export type Db = ReturnType<typeof createDb>;

export function migrateDb(db: Db) {
  return migrate(db, { migrationsFolder: new URL("../migrations", import.meta.url).pathname });
}
