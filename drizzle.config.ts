import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// 서버(server/_core/env.ts)와 동일하게 .env.local 우선, 없으면 .env 를 읽는다.
// 이미 설정된 셸 환경변수는 덮어쓰지 않는다.
dotenv.config({ path: [".env.local", ".env"], quiet: true });

// db:push 는 로컬에서 실행한다 (Render 무료 플랜은 pre-deploy 명령을 지원하지 않음).
// TiDB Cloud 등 관리형 MySQL 대상이면 DATABASE_SSL=true 도 함께 준다.
const url = process.env.DATABASE_URL || "mysql://root:password@localhost:3306/edutech";
const useSsl = process.env.DATABASE_SSL === "true";

// 주의: drizzle-kit 은 dbCredentials 에 url 을 주면 ssl 옵션을 무시한다.
// TLS로 붙으려면 URL을 개별 필드로 분해해서 넘겨야 한다. (TiDB는 평문 접속을 거부함)
function sslCredentials() {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
    ssl: { minVersion: "TLSv1.2" as const, rejectUnauthorized: true },
  };
}

export default defineConfig({
  schema: "./server/schema.ts",
  out: "./server/migrations",
  dialect: "mysql",
  dbCredentials: useSsl ? sslCredentials() : { url },
  migrations: {
    migrationsTable: "drizzle_migrations",
  },
});
