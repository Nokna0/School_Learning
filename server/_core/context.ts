import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { Request } from "express";
import { parse as parseCookie } from "cookie";

export interface Context {
  req?: Request;
  userId?: string | null;
}

// 로컬/데모 환경에서 OAuth 없이 바로 사용할 수 있도록 하는 기본 사용자.
// REQUIRE_AUTH=true 로 실행하면 비활성화된다.
export const LOCAL_USER_ID = "local-user";

export function resolveUserId(req?: Request): string | null {
  // 1) 명시적 헤더 (테스트/외부 연동용)
  const headerUserId = req?.headers["x-user-id"];
  if (typeof headerUserId === "string" && headerUserId) return headerUserId;

  // 2) 쿠키 (OAuth 콜백 등에서 설정 가능)
  const cookieHeader = req?.headers.cookie;
  if (cookieHeader) {
    const cookies = parseCookie(cookieHeader);
    if (cookies.edutech_uid) return cookies.edutech_uid;
  }

  // 3) 로컬 기본 사용자
  if (process.env.REQUIRE_AUTH !== "true") return LOCAL_USER_ID;

  return null;
}

export function createContext(opts?: CreateExpressContextOptions): Context {
  const req = opts?.req;
  return {
    req,
    userId: resolveUserId(req),
  };
}
