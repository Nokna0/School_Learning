import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../schema.js";

let _db: MySql2Database<typeof schema> | null = null;

/**
 * DB 인스턴스를 지연 초기화한다.
 * DATABASE_URL이 없어도 서버는 기동되고, DB를 쓰는 요청에서만 에러가 난다.
 */
export function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const pool = mysql.createPool(process.env.DATABASE_URL);
    _db = drizzle(pool, { schema, mode: "default" });
  }
  return _db;
}

export type Database = ReturnType<typeof getDb>;
