import { eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc.js";
import { getDb } from "../_core/db.js";
import { users } from "../schema.js";
import { LOCAL_USER_ID } from "../_core/context.js";

function fallbackUser(userId: string) {
  return {
    id: userId,
    email:
      userId === LOCAL_USER_ID ? "local@edutech.dev" : `${userId}@edutech.dev`,
    name: userId === LOCAL_USER_ID ? "로컬 사용자" : userId,
    profileImage: null as string | null,
  };
}

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      return null;
    }

    // DB에 사용자가 없으면 생성 (로컬/OAuth 공통)
    try {
      const db = getDb();
      const existing = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
      });
      if (existing) {
        return {
          id: existing.id,
          email: existing.email,
          name: existing.name,
          profileImage: existing.profileImage,
        };
      }

      const user = fallbackUser(ctx.userId);
      await db
        .insert(users)
        .values(user)
        .onDuplicateKeyUpdate({ set: { id: user.id } });
      return user;
    } catch (error) {
      // DB가 없어도 UI는 동작하도록 fallback
      console.error("auth.me DB error:", error);
      return fallbackUser(ctx.userId);
    }
  }),

  logout: protectedProcedure.mutation(() => {
    // 쿠키/세션 기반 인증 도입 시 여기서 무효화한다
    return { success: true };
  }),
});
