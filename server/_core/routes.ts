import { Router, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import {
  chatJSON,
  generateText,
  streamText,
  isAiEnabled,
  aiDisabledReason,
  getAiStatus,
  getProvider,
  getModel,
} from "./ai.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Zod schemas for validation
const mathAnalyzeSchema = z.object({
  imageBase64: z.string(),
});

const ocrSchema = z.object({
  imageBase64: z.string(),
});

const quizGenerateSchema = z.object({
  pdfText: z.string(),
  subject: z.enum(["math", "english", "chemistry"]),
});

const englishAnalyzeSchema = z.object({
  text: z.string(),
});

const answerExplainSchema = z.object({
  imageBase64: z.string(),
});

// ==================== FILE UPLOAD ====================
// POST /api/upload
router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const fileName = (req.body?.fileName as string) || file.originalname;
      const subject = (req.body?.subject as string) || "misc";

      // Upload to Cloudinary
      const uploadPromise = new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw", // For PDF files
            folder: `edutech/${subject}`, // Organize by subject
            public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, "")}`, // Remove extension
            use_filename: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        // Convert buffer to stream and pipe to Cloudinary
        const bufferStream = Readable.from(file.buffer);
        bufferStream.pipe(uploadStream);
      });

      const result = await uploadPromise;

      return res.json({
        success: true,
        fileKey: result.public_id,
        fileUrl: result.secure_url,
        fileName,
        size: file.size,
      });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ error: "Upload failed" });
    }
  },
);

// ==================== FILE DOWNLOAD URL ====================
// GET /api/download?key=<fileKey>
router.get("/download", async (req: Request, res: Response) => {
  try {
    const { key } = req.query;
    if (!key || typeof key !== "string") {
      return res.status(400).json({ error: "key parameter is required" });
    }

    const url = cloudinary.url(key, { resource_type: "raw", secure: true });
    return res.json({ success: true, url });
  } catch (error) {
    console.error("Download URL error:", error);
    return res.status(500).json({ error: "Failed to resolve download URL" });
  }
});

// ==================== MATH ANALYSIS ====================
// POST /api/math-analyze
router.post("/math-analyze", async (req: Request, res: Response) => {
  try {
    const validation = mathAnalyzeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { imageBase64 } = validation.data;

    if (!isAiEnabled()) {
      return res.json({
        success: true,
        mock: true,
        expressions: [
          {
            latex: "\\frac{x^2 + 2x + 1}{x + 1}",
            description: "Algebraic fraction",
          },
          { latex: "\\int_0^1 x^2 dx", description: "Definite integral" },
        ],
        graphDescriptions: [`${aiDisabledReason()} 예시 데이터를 표시합니다.`],
      });
    }

    const result = await chatJSON<{
      expressions: { latex: string; description: string }[];
      graphDescriptions: string[];
    }>({
      system:
        "You are a math tutor analyzing an image of a math problem for Korean students. " +
        'Respond with JSON: {"expressions": [{"latex": string, "description": string}], "graphDescriptions": string[]}. ' +
        "Extract every mathematical expression as LaTeX with a short Korean description. " +
        "If the image contains graphs or figures, describe each one in Korean in graphDescriptions; otherwise use an empty array.",
      user: "이 이미지에서 수식과 그래프를 분석해줘.",
      imageBase64,
    });

    return res.json({
      success: true,
      expressions: result.expressions ?? [],
      graphDescriptions: result.graphDescriptions ?? [],
    });
  } catch (error) {
    console.error("Math analysis error:", error);
    return res.status(500).json({ error: "Analysis failed" });
  }
});

// ==================== OCR ====================
// POST /api/ocr
router.post("/ocr", async (req: Request, res: Response) => {
  try {
    const validation = ocrSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { imageBase64 } = validation.data;

    if (!isAiEnabled()) {
      return res.json({
        success: true,
        mock: true,
        text: `${aiDisabledReason()} OCR을 수행할 수 없습니다.`,
        confidence: 0,
      });
    }

    const result = await chatJSON<{ text: string; confidence: number }>({
      system:
        "You are an OCR engine. Extract all text from the image exactly as written, preserving line breaks. " +
        'Respond with JSON: {"text": string, "confidence": number} where confidence is 0-1.',
      user: "이 이미지의 텍스트를 추출해줘.",
      imageBase64,
    });

    return res.json({
      success: true,
      text: result.text ?? "",
      confidence: result.confidence ?? 0.9,
    });
  } catch (error) {
    console.error("OCR error:", error);
    return res.status(500).json({ error: "OCR failed" });
  }
});

// ==================== QUIZ GENERATION ====================
// POST /api/quiz-generate
router.post("/quiz-generate", async (req: Request, res: Response) => {
  try {
    const validation = quizGenerateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { pdfText, subject } = validation.data;

    if (!isAiEnabled()) {
      return res.json([
        {
          id: "q1",
          type: "fill-in-the-blank",
          question: `${aiDisabledReason()} 예시 퀴즈를 표시합니다. 빈칸: ____`,
          blanks: ["예시"],
          correctAnswer: "예시",
          difficulty: "easy",
          explanation:
            "AI 공급자 설정(README의 AI 공급자 설정 참고)을 완료하면 실제 퀴즈가 생성됩니다.",
        },
      ]);
    }

    const result = await chatJSON<{
      questions: {
        id: string;
        type: "fill-in-the-blank" | "multiple-choice" | "short-answer";
        question: string;
        blanks?: string[];
        options?: string[];
        correctAnswer: string;
        difficulty: "easy" | "medium" | "hard";
        explanation: string;
      }[];
    }>({
      system:
        `You create study quizzes for Korean students from ${subject} study material. ` +
        'Respond with JSON: {"questions": [{"id": string, "type": "fill-in-the-blank" | "multiple-choice" | "short-answer", ' +
        '"question": string, "blanks": string[] (fill-in-the-blank only), "options": string[] (multiple-choice only, 4 options), ' +
        '"correctAnswer": string, "difficulty": "easy" | "medium" | "hard", "explanation": string}]}. ' +
        "Create 5 questions in Korean based strictly on the provided text. " +
        "For fill-in-the-blank, put ____ in the question where the blank is. Give ids q1..q5.",
      user: `다음 학습 자료로 퀴즈를 만들어줘:\n\n${pdfText.slice(0, 8000)}`,
      maxTokens: 3000,
    });

    return res.json(result.questions ?? []);
  } catch (error) {
    console.error("Quiz generation error:", error);
    return res.status(500).json({ error: "Quiz generation failed" });
  }
});

// ==================== ENGLISH ANALYSIS ====================
// POST /api/english-analyze
router.post("/english-analyze", async (req: Request, res: Response) => {
  try {
    const validation = englishAnalyzeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { text } = validation.data;

    if (!isAiEnabled()) {
      return res.json({ success: true, mock: true, words: [] });
    }

    const result = await chatJSON<{
      words: {
        word: string;
        difficulty: "easy" | "medium" | "hard";
        koreanMeaning: string;
        englishDefinition: string;
      }[];
    }>({
      system:
        "You help Korean students learn English vocabulary. Given an English text, pick the words a Korean high-school student " +
        "would find difficult (up to 20). " +
        'Respond with JSON: {"words": [{"word": string (exactly as it appears in the text), ' +
        '"difficulty": "easy" | "medium" | "hard", "koreanMeaning": string, "englishDefinition": string}]}.',
      user: `다음 텍스트에서 어려운 단어를 분석해줘:\n\n${text.slice(0, 8000)}`,
      maxTokens: 3000,
    });

    // 모델이 준 단어의 위치(startIndex/endIndex)는 서버에서 직접 계산한다
    const words = (result.words ?? [])
      .map((w) => {
        const startIndex = text.indexOf(w.word);
        if (startIndex === -1) return null;
        return {
          ...w,
          startIndex,
          endIndex: startIndex + w.word.length,
        };
      })
      .filter((w): w is NonNullable<typeof w> => w !== null);

    return res.json({ success: true, words });
  } catch (error) {
    console.error("English analysis error:", error);
    return res.status(500).json({ error: "Analysis failed" });
  }
});

// ==================== ANSWER EXPLANATION ====================
// POST /api/answer-explain
router.post("/answer-explain", async (req: Request, res: Response) => {
  try {
    const validation = answerExplainSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { imageBase64 } = validation.data;

    if (!isAiEnabled()) {
      return res.json({
        success: true,
        mock: true,
        explanation: `${aiDisabledReason()} 답지 설명을 생성할 수 없습니다.`,
      });
    }

    const result = await chatJSON<{ explanation: string }>({
      system:
        "You are a patient Korean math/science tutor. The image shows part of an answer sheet (해설지). " +
        "Explain the solution step by step in Korean so a student can follow the reasoning. " +
        'Respond with JSON: {"explanation": string} using line breaks between steps.',
      user: "이 답지 내용을 단계별로 자세히 설명해줘.",
      imageBase64,
      maxTokens: 3000,
    });

    return res.json({
      success: true,
      explanation: result.explanation ?? "",
    });
  } catch (error) {
    console.error("Answer explanation error:", error);
    return res.status(500).json({ error: "Explanation generation failed" });
  }
});

// ==================== WORD DEFINITION ====================
// GET /api/word-definition
router.get("/word-definition", async (req: Request, res: Response) => {
  try {
    const { word } = req.query;

    if (!word || typeof word !== "string") {
      return res.status(400).json({ error: "Word parameter is required" });
    }

    if (!isAiEnabled()) {
      return res.json({
        word: word.toLowerCase(),
        pronunciation: "",
        partOfSpeech: "",
        definition: `${aiDisabledReason()} 정의를 조회할 수 없습니다.`,
        examples: [],
        synonyms: [],
        antonyms: [],
      });
    }

    const result = await chatJSON<{
      pronunciation: string;
      partOfSpeech: string;
      definition: string;
      koreanMeaning: string;
      examples: string[];
      synonyms: string[];
      antonyms: string[];
    }>({
      system:
        "You are an English-Korean dictionary. " +
        'Respond with JSON: {"pronunciation": string (IPA), "partOfSpeech": string, "definition": string (English), ' +
        '"koreanMeaning": string, "examples": string[] (2 sentences), "synonyms": string[], "antonyms": string[]}.',
      user: `단어 정의를 알려줘: "${word}"`,
    });

    return res.json({ word: word.toLowerCase(), ...result });
  } catch (error) {
    console.error("Word definition error:", error);
    return res.status(500).json({ error: "Failed to get definition" });
  }
});

// ==================== PDF PROXY ====================
// GET /api/pdf-proxy?u=<url>  (CORS 우회용 — Cloudinary URL만 허용)
router.get("/pdf-proxy", async (req: Request, res: Response) => {
  try {
    const { u } = req.query;

    if (!u || typeof u !== "string") {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    let target: URL;
    try {
      target = new URL(u);
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const allowedHost =
      target.protocol === "https:" &&
      (target.hostname === "res.cloudinary.com" ||
        target.hostname.endsWith(".cloudinary.com"));
    if (!allowedHost) {
      return res
        .status(403)
        .json({ error: "Only Cloudinary URLs are allowed" });
    }

    const upstream = await fetch(target);
    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: `Upstream returned ${upstream.status}` });
    }

    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/pdf",
    );
    res.setHeader("Cache-Control", "public, max-age=3600");
    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.send(buffer);
  } catch (error) {
    console.error("PDF proxy error:", error);
    return res.status(500).json({ error: "Failed to proxy PDF" });
  }
});

// ==================== AI STATUS ====================
// GET /api/ai/status — 현재 AI 공급자/모델/활성화 상태
router.get("/ai/status", (req: Request, res: Response) => {
  res.json(getAiStatus());
});

// ==================== TEXT GENERATION ====================
// POST /api/generate — 단순 텍스트 생성 API
// 기본값은 실시간 스트리밍(SSE, OpenAI 표준 chunk 형식). stream: false면 JSON 한 번에 반환.
const generateSchema = z.object({
  prompt: z.string().min(1),
  system: z.string().optional(),
  maxTokens: z.number().int().positive().max(8192).optional(),
  stream: z.boolean().default(true),
});

router.post("/generate", async (req: Request, res: Response) => {
  const validation = generateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { prompt, system, maxTokens, stream } = validation.data;

  if (!isAiEnabled()) {
    return res.status(503).json({ error: aiDisabledReason() });
  }

  // 비스트리밍: 전체 텍스트를 JSON으로 반환
  if (!stream) {
    try {
      const text = await generateText({ prompt, system, maxTokens });
      return res.json({
        success: true,
        text,
        provider: getProvider(),
        model: getModel(),
      });
    } catch (error) {
      console.error("Generate error:", error);
      return res.status(500).json({ error: "Text generation failed" });
    }
  }

  // 스트리밍(기본값): SSE로 텍스트 델타를 실시간 전송 (OpenAI 표준 chunk와 동일한 형태)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    for await (const delta of streamText({ prompt, system, maxTokens })) {
      const chunk = {
        object: "chat.completion.chunk",
        model: getModel(),
        choices: [{ index: 0, delta: { content: delta }, finish_reason: null }],
      };
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.write("data: [DONE]\n\n");
  } catch (error) {
    console.error("Streaming generate error:", error);
    res.write(
      `data: ${JSON.stringify({ error: "Text generation failed" })}\n\n`,
    );
  } finally {
    res.end();
  }
});

export default router;
