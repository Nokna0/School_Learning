import {
  mysqlTable,
  varchar,
  int,
  text,
  datetime,
  decimal,
  boolean,
  mysqlEnum,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// ==================== USERS ====================
export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    profileImage: varchar("profile_image", { length: 500 }),
    // ---- 간단 로그인 (데모용) ----
    // username: 로그인 아이디. OAuth/로컬 폴백 사용자는 값이 없으므로 nullable.
    username: varchar("username", { length: 50 }).unique(),
    // ⚠️ 데모 수준: 비밀번호를 평문으로 저장/비교한다. 실제 서비스에서는 해시 필수.
    password: varchar("password", { length: 255 }),
    // TOTP(2단계 인증) — base32 시크릿. 활성화 전에도 setup 단계에서 저장된다.
    totpSecret: varchar("totp_secret", { length: 64 }),
    totpEnabled: boolean("totp_enabled").default(false).notNull(),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime("updated_at")
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
  })
);

// ==================== MATERIALS ====================
export const materials = mysqlTable(
  "materials",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: text("file_url").notNull(),
    fileKey: varchar("file_key", { length: 255 }).notNull().unique(),
    fileSize: int("file_size").notNull(),
    subject: mysqlEnum("subject", ["math", "english", "science", "korean"]).notNull(),
    // 문제/답지 수동 지정. null이면 파일명으로 자동 추정한다.
    role: mysqlEnum("role", ["question", "answer"]),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime("updated_at")
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
    subjectIdx: index("subject_idx").on(table.subject),
  })
);

// ==================== STUDY RECORDS ====================
export const studyRecords = mysqlTable(
  "study_records",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    materialId: varchar("material_id", { length: 36 }),
    subject: mysqlEnum("subject", ["math", "english", "science", "korean"]).notNull(),
    duration: int("duration").notNull(), // in minutes
    score: decimal("score", { precision: 5, scale: 2 }), // percentage 0-100
    notes: text("notes"),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
    subjectIdx: index("subject_idx").on(table.subject),
    materialIdIdx: index("material_id_idx").on(table.materialId),
  })
);

// ==================== QUIZ SESSIONS ====================
export const quizSessions = mysqlTable(
  "quiz_sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    materialId: varchar("material_id", { length: 36 }),
    subject: mysqlEnum("subject", ["math", "english", "science", "korean"]).notNull(),
    questionCount: int("question_count").notNull(),
    score: decimal("score", { precision: 5, scale: 2 }).notNull(),
    completedAt: datetime("completed_at").notNull(),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
    subjectIdx: index("subject_idx").on(table.subject),
  })
);

// ==================== QUIZ ANSWERS ====================
export const quizAnswers = mysqlTable(
  "quiz_answers",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    quizSessionId: varchar("quiz_session_id", { length: 36 }).notNull(),
    questionId: varchar("question_id", { length: 36 }).notNull(),
    userAnswer: text("user_answer").notNull(),
    correctAnswer: text("correct_answer").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    quizSessionIdIdx: index("quiz_session_id_idx").on(table.quizSessionId),
  })
);

// ==================== SAVED FORMULAS (Math) ====================
export const mathFormulas = mysqlTable(
  "math_formulas",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    expression: text("expression").notNull(), // LaTeX or plain text
    description: text("description"),
    category: varchar("category", { length: 100 }),
    color: varchar("color", { length: 7 }).default("#FF6B6B"),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime("updated_at")
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
  })
);

// ==================== SAVED WORDS (English) ====================
export const englishWords = mysqlTable(
  "english_words",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    word: varchar("word", { length: 100 }).notNull(),
    meaning: text("meaning").notNull(),
    definition: text("definition"),
    pronunciation: varchar("pronunciation", { length: 255 }),
    partOfSpeech: varchar("part_of_speech", { length: 50 }),
    difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default(
      "medium"
    ),
    example: text("example"),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime("updated_at")
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
    wordIdx: index("word_idx").on(table.word),
  })
);

// ==================== STUDY STATISTICS ====================
export const studyStatistics = mysqlTable(
  "study_statistics",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull().unique(),
    totalStudyMinutes: int("total_study_minutes").default(0),
    totalQuizzesCompleted: int("total_quizzes_completed").default(0),
    averageQuizScore: decimal("average_quiz_score", {
      precision: 5,
      scale: 2,
    }).default("0"),
    // 과목별 학습 시간은 study_records 에서 집계하므로 별도 컬럼을 두지 않는다.
    lastStudiedAt: datetime("last_studied_at"),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime("updated_at")
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
  })
);

// ==================== RELATIONS ====================
export const usersRelations = relations(users, ({ many }) => ({
  materials: many(materials),
  studyRecords: many(studyRecords),
  quizSessions: many(quizSessions),
  mathFormulas: many(mathFormulas),
  englishWords: many(englishWords),
  statistics: many(studyStatistics),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  user: one(users, {
    fields: [materials.userId],
    references: [users.id],
  }),
  studyRecords: many(studyRecords),
  quizSessions: many(quizSessions),
}));

export const studyRecordsRelations = relations(
  studyRecords,
  ({ one }) => ({
    user: one(users, {
      fields: [studyRecords.userId],
      references: [users.id],
    }),
    material: one(materials, {
      fields: [studyRecords.materialId],
      references: [materials.id],
    }),
  })
);

export const quizSessionsRelations = relations(
  quizSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [quizSessions.userId],
      references: [users.id],
    }),
    material: one(materials, {
      fields: [quizSessions.materialId],
      references: [materials.id],
    }),
    answers: many(quizAnswers),
  })
);

export const quizAnswersRelations = relations(quizAnswers, ({ one }) => ({
  quizSession: one(quizSessions, {
    fields: [quizAnswers.quizSessionId],
    references: [quizSessions.id],
  }),
}));

export const mathFormulasRelations = relations(mathFormulas, ({ one }) => ({
  user: one(users, {
    fields: [mathFormulas.userId],
    references: [users.id],
  }),
}));

export const englishWordsRelations = relations(englishWords, ({ one }) => ({
  user: one(users, {
    fields: [englishWords.userId],
    references: [users.id],
  }),
}));

export const studyStatisticsRelations = relations(
  studyStatistics,
  ({ one }) => ({
    user: one(users, {
      fields: [studyStatistics.userId],
      references: [users.id],
    }),
  })
);
