import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../schema.js";

let _db: MySql2Database<typeof schema> | null = null;

/**
 * DB 인스턴스를 지연 초기화한다.
 * DATABASE_URL이 없어도 서버는 기동되고, DB를 쓰는 요청에서만 에러가 난다.
 *
 * DATABASE_SSL=true 이면 TLS로 접속한다 (TiDB Cloud 등 관리형 MySQL은 필수).
 * 로컬/도커 MySQL은 평문이므로 설정하지 않는다.
 */
export function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      // 무료 티어 DB는 동시 커넥션 한도가 낮다. 서버도 512MB 한 대뿐이라 크게 잡을 이유가 없다.
      connectionLimit: 5,
      ...(process.env.DATABASE_SSL === "true"
        ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } }
        : {}),
    });
    _db = drizzle(pool, { schema, mode: "default" });
  }
  return _db;
}

export type Database = ReturnType<typeof getDb>;
