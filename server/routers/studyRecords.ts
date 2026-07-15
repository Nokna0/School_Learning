import { randomUUID } from "crypto";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc.js";
import { getDb } from "../_core/db.js";
import { studyRecords, mathFormulas, englishWords } from "../schema.js";

const subjectSchema = z.enum(["math", "english", "science", "korean"]);
const SUBJECTS = ["math", "english", "science", "korean"] as const;

const SUBJECT_LABEL: Record<(typeof SUBJECTS)[number], string> = {
  math: "수학",
  english: "영어",
  science: "탐구",
  korean: "국어",
};

export const studyRecordsRouter = router({
  // ==================== 학습 기록 ====================
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(studyRecords)
      .where(eq(studyRecords.userId, ctx.userId))
      .orderBy(desc(studyRecords.createdAt));
  }),

  create: protectedProcedure
    .input(
      z.object({
        subject: subjectSchema,
        duration: z.number().int().positive(), // minutes
        score: z.number().min(0).max(100).optional(),
        materialId: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const record = {
        id: randomUUID(),
        userId: ctx.userId,
        materialId: input.materialId ?? null,
        subject: input.subject,
        duration: input.duration,
        score: input.score !== undefined ? input.score.toFixed(2) : null,
        notes: input.notes ?? null,
      };
      await db.insert(studyRecords).values(record);
      return record;
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const records = await db
      .select()
      .from(studyRecords)
      .where(eq(studyRecords.userId, ctx.userId));

    const scored = records.filter((r) => r.score !== null);
    const totalMinutes = records.reduce((sum, r) => sum + r.duration, 0);
    const averageScore =
      scored.reduce((sum, r) => sum + Number(r.score), 0) /
      (scored.length || 1);

    const bySubject = SUBJECTS.map((subject) => {
      const subjectRecords = records.filter((r) => r.subject === subject);
      const subjectScored = subjectRecords.filter((r) => r.score !== null);
      return {
        subject,
        label: SUBJECT_LABEL[subject],
        records: subjectRecords.length,
        minutes: subjectRecords.reduce((sum, r) => sum + r.duration, 0),
        averageScore:
          subjectScored.reduce((sum, r) => sum + Number(r.score), 0) /
          (subjectScored.length || 1),
      };
    });

    return {
      totalRecords: records.length,
      totalMinutes,
      averageScore,
      bySubject,
    };
  }),

  // ==================== 맞춤형 학습 추천 ====================
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const records = await db
      .select()
      .from(studyRecords)
      .where(eq(studyRecords.userId, ctx.userId));

    const recommendations: {
      subject: string;
      label: string;
      reason: string;
    }[] = [];

    if (records.length === 0) {
      return {
        recommendations: SUBJECTS.map((subject) => ({
          subject,
          label: SUBJECT_LABEL[subject],
          reason: "아직 학습 기록이 없어요. 첫 학습을 시작해보세요!",
        })),
      };
    }

    const minutesBySubject = new Map<string, number>();
    const scoresBySubject = new Map<string, number[]>();
    for (const r of records) {
      minutesBySubject.set(
        r.subject,
        (minutesBySubject.get(r.subject) ?? 0) + r.duration,
      );
      if (r.score !== null) {
        const scores = scoresBySubject.get(r.subject) ?? [];
        scores.push(Number(r.score));
        scoresBySubject.set(r.subject, scores);
      }
    }

    // 1) 가장 학습 시간이 적은 과목
    const leastStudied = [...SUBJECTS].sort(
      (a, b) => (minutesBySubject.get(a) ?? 0) - (minutesBySubject.get(b) ?? 0),
    )[0];
    recommendations.push({
      subject: leastStudied,
      label: SUBJECT_LABEL[leastStudied],
      reason: `최근 학습 시간이 ${minutesBySubject.get(leastStudied) ?? 0}분으로 가장 적어요. 균형 있게 학습해보세요.`,
    });

    // 2) 평균 점수가 가장 낮은 과목
    const scoredSubjects = SUBJECTS.filter(
      (s) => (scoresBySubject.get(s)?.length ?? 0) > 0,
    );
    if (scoredSubjects.length > 0) {
      const weakest = scoredSubjects.sort((a, b) => {
        const avg = (s: string) => {
          const scores = scoresBySubject.get(s)!;
          return scores.reduce((x, y) => x + y, 0) / scores.length;
        };
        return avg(a) - avg(b);
      })[0];
      const scores = scoresBySubject.get(weakest)!;
      const avg = scores.reduce((x, y) => x + y, 0) / scores.length;
      if (weakest !== leastStudied) {
        recommendations.push({
          subject: weakest,
          label: SUBJECT_LABEL[weakest],
          reason: `평균 점수가 ${avg.toFixed(1)}점으로 가장 낮아요. 퀴즈로 복습해보세요.`,
        });
      }
    }

    return { recommendations };
  }),

  // ==================== 수학 공식 ====================
  getMathFormulas: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(mathFormulas)
      .where(eq(mathFormulas.userId, ctx.userId))
      .orderBy(desc(mathFormulas.createdAt));
    return rows.map((row) => ({
      id: row.id,
      expression: row.expression,
      description: row.description,
      type: row.category, // 클라이언트는 category를 type으로 사용
      color: row.color,
      createdAt: row.createdAt,
    }));
  }),

  saveMathFormula: protectedProcedure
    .input(
      z.object({
        expression: z.string().min(1),
        description: z.string().optional(),
        type: z.string().optional(),
        color: z.string().optional(),
        title: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const formula = {
        id: randomUUID(),
        userId: ctx.userId,
        title: input.title ?? input.expression.slice(0, 255),
        expression: input.expression,
        description: input.description ?? null,
        category: input.type ?? null,
        color: input.color ?? "#FF6B6B",
      };
      await db.insert(mathFormulas).values(formula);
      return { ...formula, type: formula.category };
    }),

  deleteMathFormula: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db
        .delete(mathFormulas)
        .where(
          and(
            eq(mathFormulas.id, input.id),
            eq(mathFormulas.userId, ctx.userId),
          ),
        );
      return { success: true };
    }),

  // ==================== 영어 단어 ====================
  getEnglishWords: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(englishWords)
      .where(eq(englishWords.userId, ctx.userId))
      .orderBy(desc(englishWords.createdAt));
  }),

  saveEnglishWord: protectedProcedure
    .input(
      z.object({
        word: z.string().min(1).max(100),
        meaning: z.string().min(1),
        definition: z.string().optional(),
        pronunciation: z.string().optional(),
        partOfSpeech: z.string().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        example: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const entry = {
        id: randomUUID(),
        userId: ctx.userId,
        word: input.word,
        meaning: input.meaning,
        definition: input.definition ?? null,
        pronunciation: input.pronunciation ?? null,
        partOfSpeech: input.partOfSpeech ?? null,
        difficulty: input.difficulty ?? ("medium" as const),
        example: input.example ?? null,
      };
      await db.insert(englishWords).values(entry);
      return entry;
    }),

  deleteEnglishWord: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db
        .delete(englishWords)
        .where(
          and(
            eq(englishWords.id, input.id),
            eq(englishWords.userId, ctx.userId),
          ),
        );
      return { success: true };
    }),
});
