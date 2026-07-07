# Nokna0-School_Hackathon

🎓 **AI-Powered Educational Learning Platform** - 다양한 과목의 학습 자료를 분석하고 개인화된 퀴즈를 생성하는 교육용 플랫폼

## 📋 목차

- [프로젝트 개요](#프로젝트-개요)
- [기능](#기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [설치 및 실행](#설치-및-실행)
- [환경 변수 설정](#환경-변수-설정)
- [API 엔드포인트](#api-엔드포인트)
- [개발 가이드](#개발-가이드)
- [문제 해결](#문제-해결)

## 프로젝트 개요

이 프로젝트는 학생들이 PDF 형식의 학습 자료를 업로드하고, AI를 활용하여 자동으로 분석 및 처리할 수 있는 교육 플랫폼입니다.

### 주요 특징

- 📄 **PDF 분석**: PDF 파일의 텍스트 및 이미지 인식
- 🧮 **수학 문제 분석**: 수식 추출 및 그래프 시각화
- 📚 **영어 학습**: 단어 분석 및 정의 제공
- 🔬 **과학 학습**: 화학 개념 학습 및 퀴즈 생성
- ✅ **자동 퀴즈 생성**: 학습 자료 기반 백지식 퀴즈 생성
- 📊 **학습 기록**: 학습 진도 및 성적 추적

## 기능

### 현재 구현된 기능

- ✅ 사용자 인증 시스템 (로컬 기본 사용자 + OAuth 연동 준비)
- ✅ PDF 파일 업로드 및 관리 (Cloudinary + MySQL)
- ✅ 다중 과목 지원 (영어, 수학, 화학)
- ✅ PDF 페이지 네비게이션
- ✅ tRPC를 통한 타입 안전 API (superjson 직렬화)
- ✅ AI 기반 이미지 분석 — 수식 추출/그래프 설명 (OpenAI Vision)
- ✅ OCR 텍스트 인식 (OpenAI Vision)
- ✅ 자동 퀴즈 생성 및 퀴즈 결과 → 학습 기록 저장
- ✅ 영어 텍스트 분석 · 단어 정의 조회 · 단어장 저장
- ✅ 수학 문제 접근 가이드 · 답지 설명 · 수식 저장
- ✅ 학습 기록 저장 및 통계 분석 (과목별 시간/점수)
- ✅ 맞춤형 학습 추천 (학습 시간·점수 기반)

> AI 기능은 OpenAI / Google(Gemini) / Anthropic(Claude) / Ollama(로컬 GPU) 중 하나의 공급자를 설정하면 동작하며, 설정이 없으면 예시 데이터로 대체됩니다. 자세한 내용은 [AI 공급자 설정](#ai-공급자-설정)을 참조하세요.

### 개발 예정 기능

- ⏳ OAuth 포털 실제 연동 (현재는 로컬 기본 사용자로 동작)
- ⏳ 퀴즈 세션/답안 상세 기록 (quiz_sessions, quiz_answers 테이블 활용)
- ⏳ 학습 통계 대시보드 시각화 (차트)

## 기술 스택

### Frontend

| 기술 | 용도 |
|------|------|
| React 19 | UI 프레임워크 |
| TypeScript | 정적 타입 지정 |
| Vite | 빌드 도구 |
| Tailwind CSS | 스타일링 |
| tRPC | 타입 안전 API 클라이언트 |
| React Query | 서버 상태 관리 |
| Wouter | 라우팅 |
| Radix UI | UI 컴포넌트 |
| PDF.js | PDF 렌더링 |

### Backend

| 기술 | 용도 |
|------|------|
| Express.js | HTTP 서버 프레임워크 |
| Node.js | JavaScript 런타임 |
| tRPC | 타입 안전 RPC |
| TypeScript | 정적 타입 지정 |
| Zod | 데이터 검증 |

### DevTools

| 기술 | 용도 |
|------|------|
| Vitest | 단위 테스트 |
| ESBuild | 번들링 |
| Prettier | 코드 포맷팅 |
| Drizzle ORM | 데이터베이스 접근 |

## 프로젝트 구조

```
Nokna0-School_Hackathon/
├── client/                          # 프론트엔드 (React)
│   ├── src/
│   │   ├── _core/
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   │   └── useAuth.ts      # 인증 관련 hook
│   │   │   └── providers/          # Context providers
│   │   ├── components/             # React 컴포넌트
│   │   │   ├── BlankQuiz.tsx       # 퀴즈 컴포넌트
│   │   │   ├── EnglishHighlighter.tsx
│   │   │   ├── MathVisualizer.tsx
│   │   │   └── ...
│   │   ├── pages/                  # 페이지 컴포넌트
│   │   │   ├── StudyPage.tsx
│   │   │   ├── EnglishStudyPage.tsx
│   │   │   ├── MathStudyPage.tsx
│   │   │   ├── ChemistryStudyPage.tsx
│   │   │   └── StudyRecordsPage.tsx
│   │   ├── lib/
│   │   │   ├── trpc.ts            # tRPC 클라이언트 설정
│   │   │   └── storage.ts         # 스토리지 유틸리티
│   │   ├── const.ts               # 상수 정의
│   │   └── main.tsx
│   └── public/
├── server/                          # 백엔드 (Express + tRPC)
│   ├── _core/
│   │   ├── index.ts               # 서버 진입점
│   │   ├── context.ts             # tRPC 컨텍스트
│   │   └── trpc.ts                # tRPC 설정
│   └── routers/
│       ├── index.ts               # 메인 라우터
│       ├── auth.ts                # 인증 라우터
│       ├── materials.ts           # 자료 관리 라우터
│       ├── mathAssist.ts          # 수학 보조 라우터
│       └── studyRecords.ts        # 학습 기록 라우터
├── shared/                          # 클라이언트-서버 공유 코드
│   └── const.ts                   # 공유 상수
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

## 설치 및 실행

### 🐳 Docker로 실행 (권장)

Docker만 설치되어 있으면 웹 + API 서버 + MySQL 전체 스택을 한 번에 실행할 수 있습니다:

```bash
cp .env.example .env   # OPENAI_API_KEY 등 필요한 값 입력
docker compose up -d --build
# → http://localhost:8080
```

자세한 내용은 [DOCKER_GUIDE.md](./DOCKER_GUIDE.md)를 참조하세요.

### 필수 요구사항 (직접 실행 시)

- Node.js 18+
- pnpm 10+

### 1. 저장소 복제

```bash
git clone https://github.com/Nokna0/Nokna0-School_Hackathon.git
cd Nokna0-School_Hackathon
```

### 2. 의존성 설치

```bash
pnpm install
```

### 3. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 편집하여 필요한 값들을 설정하세요. (아래의 [환경 변수 설정](#환경-변수-설정) 참조)

### 4. 개발 서버 실행

**터미널 1 - 백엔드 서버:**
```bash
pnpm dev
```

**터미널 2 - 프론트엔드 서버:**
```bash
pnpm dev:client
```

프론트엔드는 `http://localhost:5173`, 백엔드는 `http://localhost:3000`에서 실행됩니다.
`/api` 요청은 vite 개발 서버가 백엔드로 자동 프록시합니다.

### 5. 빌드

```bash
pnpm build
```

### 6. 프로덕션 실행

```bash
pnpm start
```

## 환경 변수 설정

### `.env.local` 파일 생성

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Client Configuration
VITE_APP_TITLE=EduTech
VITE_APP_ID=your_app_id
VITE_OAUTH_PORTAL_URL=https://oauth.example.com

# Database
DATABASE_URL=mysql://user:password@localhost:3306/edutech

# Cloudinary (파일 업로드용)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OpenAI API (AI 분석용)
OPENAI_API_KEY=your_openai_api_key

# CORS
CORS_ORIGIN=http://localhost:5173
```

## AI 공급자 설정

AI 기능(이미지 분석, 퀴즈 생성, 텍스트 생성 등)은 4가지 공급자 중 하나를 선택해 사용할 수 있습니다. **모든 공급자는 OpenAI 표준 API(chat.completions)로 통일해서 호출**하므로, 공급자를 바꿔도 서버 코드는 동일하게 동작합니다.

`.env`(또는 `.env.local`)에서 `AI_PROVIDER`로 선택합니다:

| `AI_PROVIDER` | 필요한 설정 | 기본 모델 | 비고 |
|---------------|------------|-----------|------|
| `openai` (기본) | `OPENAI_API_KEY` | `gpt-4o-mini` | |
| `google` | `GOOGLE_API_KEY` | `gemini-2.5-flash` | Gemini의 OpenAI 호환 엔드포인트 사용 |
| `anthropic` | `ANTHROPIC_API_KEY` | `claude-opus-4-8` | Claude의 OpenAI 호환 엔드포인트 사용 |
| `ollama` | Ollama 설치 (키 불필요) | `llama3.2` | **사용자의 GPU 자원 사용** — 아래 참조 |

모델은 `AI_MODEL`(공급자 공통) 또는 공급자별 변수(`OPENAI_MODEL`, `GOOGLE_MODEL`, `ANTHROPIC_MODEL`, `OLLAMA_MODEL`)로 변경할 수 있습니다. 현재 설정은 `GET /api/ai/status`로 확인합니다.

### Ollama로 로컬 GPU 사용하기

API 키 없이 **사용자 컴퓨터의 GPU**로 AI 기능을 실행할 수 있습니다. 이 옵션을 사용하려면 컴퓨터에 [Ollama](https://ollama.com/download)를 설치해야 합니다.

```bash
# 1. Ollama 설치 (https://ollama.com/download)
#    macOS: brew install ollama / Windows·Linux: 공식 사이트 설치 프로그램

# 2. 모델 다운로드
ollama pull llama3.2              # 텍스트용
ollama pull llama3.2-vision      # (선택) 이미지 분석용 — OCR/수식 추출에 필요

# 3. .env 설정
# AI_PROVIDER=ollama
# OLLAMA_MODEL=llama3.2
# OLLAMA_VISION_MODEL=llama3.2-vision
```

서버는 Ollama의 **OpenAI 호환 엔드포인트**(`http://localhost:11434/v1`)로 요청을 보내므로, API 요청 형식은 다른 공급자와 완전히 동일합니다(OpenAI 표준). 용도에 따라 두 방식을 구분해 사용합니다:

- **구조화된 분석**(수식 추출, 퀴즈 생성 등 JSON 응답이 필요한 경우): 전체 응답을 파싱해야 하므로 비스트리밍 호출
- **단순 텍스트 생성**(`/api/generate`): 실시간 스트리밍이 기본값 — 로컬 모델은 생성 속도가 느릴 수 있어 토큰이 생성되는 대로 바로 전송됩니다

Docker로 서버를 실행하는 경우, 컨테이너는 `host.docker.internal`을 통해 호스트 PC의 Ollama에 자동으로 연결됩니다(compose에 기본 설정됨). Ollama만 호스트에서 실행해두면 됩니다.

### 인증 동작

- 기본값으로는 로그인 없이 **로컬 기본 사용자**(`local-user`)로 동작합니다.
- `REQUIRE_AUTH=true`로 설정하면 `x-user-id` 헤더 또는 `edutech_uid` 쿠키가 있어야 인증됩니다.
- DB(`DATABASE_URL`)는 자료/학습 기록 기능에 필요합니다. Docker Compose 사용 시 자동 구성됩니다.

## API 엔드포인트

### tRPC 라우터

#### `auth` 라우터

```typescript
// 현재 사용자 정보 조회
trpc.auth.me.useQuery()

// 로그아웃
trpc.auth.logout.useMutation()
```

#### `materials` 라우터

```typescript
// 학습 자료 목록 조회
trpc.materials.list.useQuery({ subject: 'math' })

// 학습 자료 업로드 (Cloudinary 업로드 후 메타데이터 저장)
trpc.materials.upload.useMutation()
// input: { subject, fileName, fileUrl, fileKey, fileSize }
```

#### `mathAssist` 라우터

```typescript
// 문제 접근 가이드 (OpenAI)
trpc.mathAssist.questionHelp.useMutation()
// input: { text: '문제 텍스트' }
// output: { keyConcepts, approachSteps, cautionPoints, phraseExplanations }
```

#### `studyRecords` 라우터

```typescript
// 학습 기록
trpc.studyRecords.list.useQuery()
trpc.studyRecords.create.useMutation()   // { subject, duration, score?, materialId?, notes? }
trpc.studyRecords.getStats.useQuery()    // 총 학습 시간/평균 점수 + 과목별 통계
trpc.studyRecords.getRecommendations.useQuery() // 맞춤형 학습 추천

// 수학 공식 저장소
trpc.studyRecords.getMathFormulas.useQuery()
trpc.studyRecords.saveMathFormula.useMutation()   // { expression, description?, type?, color? }
trpc.studyRecords.deleteMathFormula.useMutation() // { id }

// 영어 단어장
trpc.studyRecords.getEnglishWords.useQuery()
trpc.studyRecords.saveEnglishWord.useMutation()   // { word, meaning, definition?, difficulty?, ... }
trpc.studyRecords.deleteEnglishWord.useMutation() // { id }
```

### REST API 엔드포인트

| Method | 엔드포인트 | 설명 | 비고 |
|--------|-----------|------|------|
| POST | `/api/upload` | 파일 업로드 (PDF → Cloudinary) | `CLOUDINARY_*` 필요 |
| GET | `/api/download?key=` | 파일 다운로드 URL 조회 | |
| POST | `/api/math-analyze` | 수학 이미지 분석 (수식 LaTeX 추출) | AI (비전) |
| POST | `/api/ocr` | 이미지 텍스트 인식 | AI (비전) |
| POST | `/api/quiz-generate` | 퀴즈 자동 생성 (5문항) | AI |
| POST | `/api/english-analyze` | 영어 텍스트 어려운 단어 분석 | AI |
| POST | `/api/answer-explain` | 답지 단계별 설명 생성 | AI (비전) |
| GET | `/api/word-definition?word=` | 단어 정의/발음/예문 조회 | AI |
| POST | `/api/generate` | 단순 텍스트 생성 (실시간 스트리밍 기본값) | AI |
| GET | `/api/ai/status` | 현재 AI 공급자/모델/활성화 상태 조회 | |
| GET | `/api/pdf-proxy?u=` | PDF 프록시 (CORS 우회, Cloudinary만 허용) | |

> AI 엔드포인트는 공급자 미설정 시 예시(mock) 응답을 반환합니다. 공급자 선택은 [AI 공급자 설정](#ai-공급자-설정)을 참조하세요.

#### `/api/generate` 사용법

단순 텍스트 생성 API입니다. 기본값은 **실시간 스트리밍**(SSE, OpenAI 표준 chunk 형식)이며, 전체 응답을 한 번에 받으려면 `stream: false`를 지정합니다.

```bash
# 스트리밍 (기본값) — data: {"choices":[{"delta":{"content":"..."}}]} 형식으로 전송
curl -N -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "광합성을 한 문단으로 설명해줘"}'

# 비스트리밍 — {"success":true,"text":"...","provider":"...","model":"..."}
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "광합성을 한 문단으로 설명해줘", "stream": false}'
```

## 개발 가이드

### 컴포넌트 개발

새로운 컴포넌트를 만들 때는 다음 패턴을 따르세요:

```typescript
import { FC } from 'react';
import { Card } from '@/components/ui/card';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent: FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <Card>
      <h2>{title}</h2>
      {/* 컴포넌트 내용 */}
    </Card>
  );
};
```

### tRPC 라우터 추가

새로운 라우터를 추가하려면:

```typescript
// server/routers/myRouter.ts
import { router, publicProcedure } from "../_core/trpc.js";
import { z } from "zod";

export const myRouter = router({
  getData: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // 로직 구현
      return { data: 'example' };
    }),
});

// server/routers/index.ts에 추가
export const appRouter = router({
  // ... 기존 라우터
  my: myRouter,
});
```

### 테스트 작성

```bash
pnpm test
```

Vitest를 사용하여 단위 테스트를 작성하세요:

```typescript
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should render correctly', () => {
    expect(true).toBe(true);
  });
});
```

### 코드 포맷팅

```bash
pnpm format
```

Prettier로 코드를 자동 포맷합니다.

### 타입 체크

```bash
pnpm check
```

TypeScript 타입을 검사합니다.

## 문제 해결

### Q: "Module not found" 에러가 발생합니다.

**A:** `tsconfig.json`의 경로 매핑을 확인하세요:

```json
"paths": {
  "@/*": ["./client/src/*"],
  "@shared/*": ["./shared/*"]
}
```

### Q: PDF가 렌더링되지 않습니다.

**A:** PDF.js worker는 `client/src/lib/pdf.ts`에서 번들에 포함된 파일로 설정됩니다. PDF를 다루는 페이지에서 아래 두 import가 모두 있는지 확인하세요:

```typescript
import * as pdfjsLib from "pdfjs-dist";
import "@/lib/pdf"; // worker 설정 (필수)
```

### Q: tRPC 라우터에 접근할 수 없습니다.

**A:** 라우터가 `server/routers/index.ts`의 `appRouter`에 추가되었는지 확인하세요.

### Q: 환경 변수가 로드되지 않습니다.

**A:** `.env.local` 파일이 프로젝트 루트에 있는지 확인하고, 개발 서버를 재시작하세요.

## 기여 가이드

버그 리포트나 기능 제안은 [GitHub Issues](https://github.com/Nokna0/Nokna0-School_Hackathon/issues)에서 해주세요.

## 라이선스

MIT License - [LICENSE](./LICENSE) 파일 참조

## 연락처

- GitHub: [@Nokna0](https://github.com/Nokna0)

---

**마지막 업데이트**: 2025년 11월 14일
