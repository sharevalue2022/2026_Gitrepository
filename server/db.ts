import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import pg from "pg";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";

const { Pool } = pg;

// If DATABASE_URL is set, use PostgreSQL; otherwise use SQLite in-memory
if (process.env.DATABASE_URL) {
  console.log("Using PostgreSQL database");
  export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  export const db = drizzlePg(pool, { schema });
} else {
  console.log("DATABASE_URL not set - using in-memory SQLite database (data will not persist)");
  const sqlite = new Database(":memory:");

  // Create tables for SQLite
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone_number TEXT UNIQUE NOT NULL,
      gender TEXT NOT NULL,
      name TEXT,
      date_of_birth TEXT,
      location TEXT,
      occupation TEXT,
      bio TEXT,
      interests TEXT,
      photos TEXT,
      is_phone_verified INTEGER DEFAULT 0,
      is_king_member INTEGER DEFAULT 0,
      king_membership_start_date TEXT,
      is_suspended INTEGER DEFAULT 0,
      is_banned INTEGER DEFAULT 0,
      suspension_reason TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user1_id TEXT NOT NULL,
      user2_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user1_id) REFERENCES users(id),
      FOREIGN KEY (user2_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payment_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      deposit_proof TEXT,
      submitted_at TEXT DEFAULT (datetime('now')),
      processed_at TEXT,
      processed_by TEXT,
      notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  export const db = drizzleSqlite(sqlite, { schema });
  export const pool = null;
}
