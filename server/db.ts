import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

let pool: any = null;
let db: any = null;

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL not set - using in-memory storage (data will not persist)");
  // Will use InMemoryStorage from storage.ts
  pool = null;
  db = null;
} else {
  console.log("Using PostgreSQL database");
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

export { pool, db };
