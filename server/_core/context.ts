import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { Request, Response } from "express";
import { parse as parseCookie } from "cookie";

export interface Context {
  req?: Request;
  res?: Response;
  userId?: string | null;
  // 실제 로그인 세션(쿠키/헤더)로 들어온 사용자인지 여부.
  // 로컬 폴백(LOCAL_USER_ID)은 false — 비로그인 상태로 취급한다.
  isLoggedIn: boolean;
}

// 로컬/데모 환경에서 OAuth 없이 바로 사용할 수 있도록 하는 기본 사용자.
// REQUIRE_AUTH=true 로 실행하면 비활성화된다.
export const LOCAL_USER_ID = "local-user";

// 로그인 세션을 담는 쿠키 이름.
export const AUTH_COOKIE = "edutech_uid";

/**
 * 요청에서 사용자 식별자와 "실제 로그인 여부"를 함께 판별한다.
 * - 헤더/쿠키로 온 사용자는 isLoggedIn=true (실제 세션)
 * - 아무것도 없으면 로컬 폴백 사용자로 서비스는 쓰되 isLoggedIn=false (비로그인)
 */
export function resolveAuth(req?: Request): {
  userId: string | null;
  isLoggedIn: boolean;
} {
  // 1) 명시적 헤더 (테스트/외부 연동용)
  const headerUserId = req?.headers["x-user-id"];
  if (typeof headerUserId === "string" && headerUserId) {
    return { userId: headerUserId, isLoggedIn: true };
  }

  // 2) 쿠키 (로그인 성공 시 설정됨)
  const cookieHeader = req?.headers.cookie;
  if (cookieHeader) {
    const cookies = parseCookie(cookieHeader);
    if (cookies[AUTH_COOKIE]) {
      return { userId: cookies[AUTH_COOKIE], isLoggedIn: true };
    }
  }

  // 3) 로컬 기본 사용자 (비로그인이지만 기능은 사용 가능)
  if (process.env.REQUIRE_AUTH !== "true") {
    return { userId: LOCAL_USER_ID, isLoggedIn: false };
  }

  return { userId: null, isLoggedIn: false };
}

// 하위 호환: userId만 필요한 곳을 위해 유지.
export function resolveUserId(req?: Request): string | null {
  return resolveAuth(req).userId;
}

export function createContext(opts?: CreateExpressContextOptions): Context {
  const req = opts?.req;
  const { userId, isLoggedIn } = resolveAuth(req);
  return {
    req,
    res: opts?.res,
    userId,
    isLoggedIn,
  };
}
