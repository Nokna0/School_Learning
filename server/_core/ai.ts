import OpenAI from "openai";

/**
 * 멀티 프로바이더 AI 레이어
 *
 * 모든 공급자를 OpenAI 표준 API(chat.completions)로 통일해서 호출한다.
 * - openai    : OpenAI API (기본값)
 * - google    : Gemini의 OpenAI 호환 엔드포인트
 * - anthropic : Claude의 OpenAI 호환 엔드포인트
 * - ollama    : 사용자 PC의 GPU 자원 사용 — 로컬에 Ollama 설치 필요.
 *               localhost의 OpenAI 호환 엔드포인트(11434/v1)로 요청한다.
 *
 * 용도별 사용:
 * - 구조화된 분석/퀴즈(JSON 필요) → chatJSON (전체 응답을 파싱해야 하므로 비스트리밍)
 * - 단순 텍스트 생성            → generateText / streamText (스트리밍이 기본값)
 */

export type AiProvider = "openai" | "google" | "anthropic" | "ollama";

interface ProviderConfig {
  baseURL?: string;
  apiKey: string | undefined;
  /** ollama처럼 API 키가 필요 없는 공급자 여부 */
  keyless: boolean;
  defaultModel: string;
  /** OpenAI 표준 response_format(json_object) 지원 여부 */
  supportsJsonFormat: boolean;
}

function ollamaBaseURL() {
  // OpenAI 호환 엔드포인트 전체 경로 (기본: 로컬 Ollama)
  return process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
}

function providerConfig(provider: AiProvider): ProviderConfig {
  switch (provider) {
    case "google":
      return {
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
        keyless: false,
        defaultModel: process.env.GOOGLE_MODEL || "gemini-2.5-flash",
        supportsJsonFormat: true,
      };
    case "anthropic":
      return {
        baseURL: "https://api.anthropic.com/v1/",
        apiKey: process.env.ANTHROPIC_API_KEY,
        keyless: false,
        defaultModel: process.env.ANTHROPIC_MODEL || "claude-opus-4-8",
        // Anthropic OpenAI 호환 레이어는 response_format을 보장하지 않으므로
        // 프롬프트 지시 + JSON 추출로 처리한다
        supportsJsonFormat: false,
      };
    case "ollama":
      return {
        baseURL: ollamaBaseURL(),
        apiKey: process.env.OLLAMA_API_KEY || "ollama", // 로컬 Ollama는 키 불필요(형식상 값)
        keyless: true,
        defaultModel: process.env.OLLAMA_MODEL || "llama3.2",
        supportsJsonFormat: true,
      };
    case "openai":
    default:
      return {
        baseURL: process.env.OPENAI_BASE_URL || undefined,
        apiKey: process.env.OPENAI_API_KEY,
        keyless: false,
        defaultModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
        supportsJsonFormat: true,
      };
  }
}

export function getProvider(): AiProvider {
  const p = (process.env.AI_PROVIDER || "openai").toLowerCase();
  if (p === "google" || p === "gemini") return "google";
  if (p === "anthropic" || p === "claude") return "anthropic";
  if (p === "ollama" || p === "local") return "ollama";
  return "openai";
}

export function getModel(provider: AiProvider = getProvider()): string {
  // AI_MODEL이 있으면 공급자별 기본값보다 우선
  return process.env.AI_MODEL || providerConfig(provider).defaultModel;
}

/** 비전(이미지) 요청용 모델 — Ollama는 비전 모델이 따로 필요할 수 있다 */
export function getVisionModel(provider: AiProvider = getProvider()): string {
  if (provider === "ollama" && process.env.OLLAMA_VISION_MODEL) {
    return process.env.OLLAMA_VISION_MODEL;
  }
  return getModel(provider);
}

export function isAiEnabled(provider: AiProvider = getProvider()): boolean {
  const cfg = providerConfig(provider);
  return cfg.keyless || Boolean(cfg.apiKey);
}

/** AI 비활성화 시 사용자에게 보여줄 안내 문구 */
export function aiDisabledReason(provider: AiProvider = getProvider()): string {
  const keyName = {
    openai: "OPENAI_API_KEY",
    google: "GOOGLE_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    ollama: "OLLAMA_BASE_URL",
  }[provider];
  return `AI 공급자(${provider})의 ${keyName}가 설정되지 않았습니다.`;
}

export function getAiStatus() {
  const provider = getProvider();
  const cfg = providerConfig(provider);
  return {
    provider,
    model: getModel(provider),
    visionModel: getVisionModel(provider),
    enabled: isAiEnabled(provider),
    baseURL: provider === "ollama" ? cfg.baseURL : undefined,
    note:
      provider === "ollama"
        ? "로컬 GPU(Ollama) 모드 — 사용자의 컴퓨터에 Ollama가 설치·실행 중이어야 합니다."
        : undefined,
  };
}

const clients = new Map<AiProvider, OpenAI>();

function getClient(provider: AiProvider = getProvider()): OpenAI {
  const cfg = providerConfig(provider);
  if (!cfg.keyless && !cfg.apiKey) {
    throw new Error(aiDisabledReason(provider));
  }
  let client = clients.get(provider);
  if (!client) {
    client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL });
    clients.set(provider, client);
  }
  return client;
}

/** 모델이 코드펜스/설명을 섞어 보내도 JSON 객체를 견고하게 추출한다 */
function extractJSON<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    /* fall through */
  }
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    /* fall through */
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  }
  throw new Error("AI 응답에서 JSON을 파싱하지 못했습니다");
}

function buildUserContent(
  user: string,
  imageBase64?: string,
): string | OpenAI.Chat.ChatCompletionContentPart[] {
  if (!imageBase64) return user;
  return [
    { type: "text", text: user },
    {
      type: "image_url",
      image_url: { url: `data:image/png;base64,${imageBase64}` },
    },
  ];
}

/**
 * 구조화된 분석용 — JSON 객체 응답 (비스트리밍).
 * 전체 JSON을 파싱해야 하므로 스트리밍을 사용하지 않는다.
 */
export async function chatJSON<T>(options: {
  system: string;
  user: string;
  imageBase64?: string;
  maxTokens?: number;
}): Promise<T> {
  const provider = getProvider();
  const client = getClient(provider);
  const cfg = providerConfig(provider);
  const model = options.imageBase64
    ? getVisionModel(provider)
    : getModel(provider);

  const completion = await client.chat.completions.create({
    model,
    ...(cfg.supportsJsonFormat
      ? { response_format: { type: "json_object" as const } }
      : {}),
    max_tokens: options.maxTokens ?? 2000,
    messages: [
      {
        role: "system",
        content:
          options.system +
          " Respond ONLY with a valid JSON object — no markdown, no explanations.",
      },
      {
        role: "user",
        content: buildUserContent(options.user, options.imageBase64),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error(`Empty response from AI provider (${provider})`);
  return extractJSON<T>(raw);
}

/** 단순 텍스트 생성 — 전체 텍스트를 한 번에 반환 (비스트리밍) */
export async function generateText(options: {
  prompt: string;
  system?: string;
  maxTokens?: number;
}): Promise<string> {
  const provider = getProvider();
  const client = getClient(provider);

  const completion = await client.chat.completions.create({
    model: getModel(provider),
    max_tokens: options.maxTokens ?? 2000,
    messages: [
      ...(options.system
        ? [{ role: "system" as const, content: options.system }]
        : []),
      { role: "user" as const, content: options.prompt },
    ],
  });

  return completion.choices[0]?.message?.content ?? "";
}

/**
 * 단순 텍스트 생성 — 실시간 스트리밍 (기본값).
 * OpenAI 표준 스트리밍(stream: true)을 사용하며, 텍스트 델타를 순서대로 yield한다.
 */
export async function* streamText(options: {
  prompt: string;
  system?: string;
  maxTokens?: number;
}): AsyncGenerator<string> {
  const provider = getProvider();
  const client = getClient(provider);

  const stream = await client.chat.completions.create({
    model: getModel(provider),
    max_tokens: options.maxTokens ?? 2000,
    stream: true,
    messages: [
      ...(options.system
        ? [{ role: "system" as const, content: options.system }]
        : []),
      { role: "user" as const, content: options.prompt },
    ],
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
