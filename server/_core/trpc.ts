import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context.js";

// 클라이언트(main.tsx)의 httpBatchLink와 동일한 transformer를 써야 한다
const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const procedure = t.procedure;
export const middleware = t.middleware;

// Public procedure (no auth required)
export const publicProcedure = t.procedure;

// Protected procedure (auth required)
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});
