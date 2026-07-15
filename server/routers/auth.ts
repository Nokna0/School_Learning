import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Request, Response } from "express";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc.js";
import { getDb } from "../_core/db.js";
import { users } from "../schema.js";
import { LOCAL_USER_ID, AUTH_COOKIE } from "../_core/context.js";
import { generateTotpSecret, otpauthUri, verifyTotp } from "../_core/totp.js";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function fallbackUser(userId: string) {
  return {
    id: userId,
    email:
      userId === LOCAL_USER_ID ? "local@edutech.dev" : `${userId}@edutech.dev`,
    name: userId === LOCAL_USER_ID ? "로컬 사용자" : userId,
    profileImage: null as string | null,
  };
}

// 프론트로 내보내는 안전한 사용자 형태 (비밀번호/시크릿 제외).
function publicUser(u: {
  id: string;
  email: string;
  name: string;
  profileImage: string | null;
  username?: string | null;
  totpEnabled?: boolean;
}) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    profileImage: u.profileImage,
    username: u.username ?? null,
    totpEnabled: u.totpEnabled ?? false,
  };
}

// 프론트/백엔드가 다른 도메인이면(운영: Netlify→Render) SameSite=None+Secure가
// 필요하고, 같은 오리진이면(로컬 도커: nginx 프록시) Lax로 충분하다.
function isCrossSite(req?: Request): boolean {
  const origin = req?.headers.origin;
  const host = req?.headers.host;
  if (!origin || !host) return false;
  try {
    return new URL(origin).host !== host;
  } catch {
    return false;
  }
}

function setAuthCookie(req: Request | undefined, res: Response | undefined, userId: string) {
  const cross = isCrossSite(req);
  res?.cookie(AUTH_COOKIE, userId, {
    httpOnly: true,
    sameSite: cross ? "none" : "lax",
    secure: cross,
    path: "/",
    maxAge: ONE_YEAR_MS,
  });
}

function clearAuthCookie(res: Response | undefined) {
  res?.clearCookie(AUTH_COOKIE, { path: "/" });
}

const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "아이디는 3자 이상이어야 합니다.")
    .max(50)
    .regex(/^[a-zA-Z0-9_.-]+$/, "아이디는 영문/숫자/._- 만 사용할 수 있습니다."),
  password: z.string().min(4, "비밀번호는 4자 이상이어야 합니다.").max(255),
});

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    // 실제 로그인 세션이 아니면(로컬 폴백 = 비로그인) 사용자 없음으로 응답한다.
    // → 프론트는 이 값을 기준으로 홍보 페이지/대시보드를 가른다.
    if (!ctx.userId || !ctx.isLoggedIn) {
      return null;
    }

    try {
      const db = getDb();
      const existing = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
      });
      if (existing) {
        return publicUser(existing);
      }

      // 세션은 있으나 DB에 없는 경우(외부 헤더 등) 폴백 사용자 생성.
      const user = fallbackUser(ctx.userId);
      await db
        .insert(users)
        .values(user)
        .onDuplicateKeyUpdate({ set: { id: user.id } });
      return publicUser({ ...user, username: null, totpEnabled: false });
    } catch (error) {
      console.error("auth.me DB error:", error);
      return publicUser({ ...fallbackUser(ctx.userId), username: null });
    }
  }),

  register: publicProcedure
    .input(credentialsSchema)
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const taken = await db.query.users.findFirst({
        where: eq(users.username, input.username),
      });
      if (taken) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "이미 사용 중인 아이디입니다.",
        });
      }

      const id = crypto.randomUUID();
      const email = `${input.username}@edutech.local`;
      // ⚠️ 데모: 비밀번호를 평문 그대로 저장한다.
      await db.insert(users).values({
        id,
        email,
        name: input.username,
        username: input.username,
        password: input.password,
      });

      // 가입과 동시에 로그인.
      setAuthCookie(ctx.req, ctx.res, id);
      return publicUser({
        id,
        email,
        name: input.username,
        profileImage: null,
        username: input.username,
        totpEnabled: false,
      });
    }),

  login: publicProcedure
    .input(credentialsSchema.extend({ token: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(users.username, input.username),
      });

      // ⚠️ 데모: 평문 비교.
      if (!user || user.password !== input.password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "아이디 또는 비밀번호가 올바르지 않습니다.",
        });
      }

      if (user.totpEnabled) {
        if (!input.token) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "2단계 인증 코드를 입력하세요.",
          });
        }
        if (!user.totpSecret || !verifyTotp(user.totpSecret, input.token)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "2단계 인증 코드가 올바르지 않습니다.",
          });
        }
      }

      setAuthCookie(ctx.req, ctx.res, user.id);
      return publicUser(user);
    }),

  logout: protectedProcedure.mutation(({ ctx }) => {
    clearAuthCookie(ctx.res);
    return { success: true };
  }),

  // ==================== TOTP (2단계 인증) ====================
  // 시크릿을 발급/저장하고 등록용 정보를 돌려준다(아직 활성화 아님).
  setupTotp: protectedProcedure.mutation(async ({ ctx }) => {
    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
    });
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다." });
    }

    const secret = generateTotpSecret();
    await db
      .update(users)
      .set({ totpSecret: secret, totpEnabled: false })
      .where(eq(users.id, ctx.userId));

    return {
      secret,
      otpauthUri: otpauthUri(secret, user.username ?? user.name),
    };
  }),

  // 인증 앱이 만든 코드로 시크릿을 확인하고 2단계 인증을 켠다.
  enableTotp: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
      });
      if (!user?.totpSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "먼저 TOTP 설정을 시작하세요.",
        });
      }
      if (!verifyTotp(user.totpSecret, input.token)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "코드가 올바르지 않습니다. 다시 시도하세요.",
        });
      }
      await db
        .update(users)
        .set({ totpEnabled: true })
        .where(eq(users.id, ctx.userId));
      return { success: true };
    }),

  disableTotp: protectedProcedure.mutation(async ({ ctx }) => {
    const db = getDb();
    await db
      .update(users)
      .set({ totpEnabled: false, totpSecret: null })
      .where(eq(users.id, ctx.userId));
    return { success: true };
  }),
});
