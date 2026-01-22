import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL not set - using in-memory storage (data will not persist)");
  // Will use InMemoryStorage from storage.ts
  export const pool = null;
  export const db = null as any;
} else {
  console.log("Using PostgreSQL database");
  export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  export const db = drizzle(pool, { schema });
}
