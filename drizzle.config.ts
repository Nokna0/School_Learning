import { defineConfig } from "drizzle-kit";

// db:push 는 로컬에서 실행한다 (Render 무료 플랜은 pre-deploy 명령을 지원하지 않음).
// TiDB Cloud 등 관리형 MySQL 대상이면 DATABASE_SSL=true 도 함께 준다.
const useSsl = process.env.DATABASE_SSL === "true";

export default defineConfig({
  schema: "./server/schema.ts",
  out: "./server/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "mysql://root:password@localhost:3306/edutech",
    ...(useSsl ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } } : {}),
  },
  migrations: {
    migrationsTable: "drizzle_migrations",
  },
});
