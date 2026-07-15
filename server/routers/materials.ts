import { randomUUID } from "crypto";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc.js";
import { getDb } from "../_core/db.js";
import { cloudinary } from "../_core/cloudinary.js";
import { materials } from "../schema.js";

const subjectSchema = z.enum(["math", "english", "chemistry"]);

export const materialsRouter = router({
  list: publicProcedure
    .input(z.object({ subject: subjectSchema }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(materials)
        .where(input ? eq(materials.subject, input.subject) : undefined)
        .orderBy(desc(materials.createdAt));
      return rows;
    }),

  upload: protectedProcedure
    .input(
      z.object({
        subject: subjectSchema,
        fileName: z.string().min(1),
        fileUrl: z.string().min(1),
        fileKey: z.string().min(1),
        fileSize: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const material = {
        id: randomUUID(),
        userId: ctx.userId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        fileSize: input.fileSize,
        subject: input.subject,
      };
      await db.insert(materials).values(material);
      return material;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // 먼저 Cloudinary 원본을 지우려면 fileKey가 필요하다.
      const [row] = await db
        .select()
        .from(materials)
        .where(eq(materials.id, input.id))
        .limit(1);

      if (!row) return { deleted: false };

      await db.delete(materials).where(eq(materials.id, input.id));

      // Cloudinary 삭제는 실패해도 DB 삭제는 유효하게 둔다(로그만 남김).
      try {
        await cloudinary.uploader.destroy(row.fileKey, { resource_type: "raw" });
      } catch (err) {
        console.error("Cloudinary destroy failed:", err);
      }

      return { deleted: true };
    }),
});
