# EduTech (School_Learning)

🎓 **AI 학습 도우미** — PDF 학습 자료(국어·영어·수학·탐구)를 올리면 AI가 분석하고, 요약·플래시카드·퀴즈까지 만들어 주는 웹 학습 플랫폼.

> 🌐 **라이브 데모**
> - 프론트: <https://nokchamaru.netlify.app>
> - API: <https://edutech-api-sh3f.onrender.com>
>
> 무료 티어로 배포되어 있어 첫 요청은 콜드 스타트로 30~60초 걸릴 수 있습니다.

## 📋 목차

- [프로젝트 개요](#프로젝트-개요)
- [기능](#기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [설치 및 실행](#설치-및-실행)
- [환경 변수 설정](#환경-변수-설정)
- [AI 공급자 설정](#ai-공급자-설정)
- [API 엔드포인트](#api-엔드포인트)
- [개발 가이드](#개발-가이드)
- [배포](#배포)
- [문제 해결](#문제-해결)

## 프로젝트 개요

학생이 PDF 학습 자료를 업로드하면, AI가 과목에 맞춰 분석해 주는 학습 도구입니다. PDF는 Cloudinary에 저장되고 메타데이터만 DB에 들어갑니다. 로그인하면 메인이 **대시보드**(학습 통계 + 과목 바로가기)로, 로그인하지 않으면 홍보 페이지로 갈립니다. 비로그인 상태에서도 분석 기능은 그대로 쓸 수 있고, 학습 현황만 계정에 쌓이지 않습니다.

### 과목별 학습

- 📖 **국어**: 지문의 주제·정서·표현·어휘 분석
- 📚 **영어**: 어려운 단어 분석 → 한국어 뜻·정의 제공, 단어장 저장
- 📐 **수학**: 페이지 이미지를 OCR/비전으로 분석 → 수식(LaTeX) 추출·그래프 시각화, 답지 단계별 설명, 수식 저장
- 🔬 **탐구**: 과학·사회 개념 정리 및 지문 기반 학습

### 공통 학습 도구 (모든 과목)

핵심 요약 · 암기 플래시카드 · 핵심 용어 정리 · 개념 쉽게 풀이 · 백지 퀴즈 생성.

### ✨ 드래그 영역 분석 (전 과목)

PDF에서 **원하는 부분을 드래그하면 그 영역만**, 드래그하지 않으면 **페이지 전체**를 분석합니다. 모든 과목의 분석 기능과 공통 학습 도구에 동일하게 적용됩니다.

- 국어·영어·탐구·공통 도구는 드래그 영역에 걸치는 **텍스트**만 추출해 분석합니다(OCR 왕복 없이 PDF 텍스트 좌표로 계산).
- 수학은 드래그 영역(없으면 페이지 전체)을 **이미지로 크롭**해 비전 분석합니다.

## 기능

### 현재 구현된 기능

- ✅ **계정 로그인** — 아이디/비밀번호 + **TOTP 2단계 인증**(RFC 6238, Google Authenticator 등과 호환). 회원가입 포함
- ✅ 로그인 상태에 따른 메인 분기(홍보 페이지 ↔ 대시보드)
- ✅ PDF 업로드·목록·이름 변경·삭제 (Cloudinary + MySQL)
- ✅ 문제/답지 역할 지정 및 전환 (파일명 규칙 자동 감지 + 수동 지정)
- ✅ PDF 렌더링·확대/축소·페이지 이동, **드래그 영역 선택**
- ✅ 다중 과목 지원 (국어·영어·수학·탐구)
- ✅ AI 이미지 분석 — 수식(LaTeX) 추출/그래프 설명, OCR, 답지 설명 (비전)
- ✅ AI 텍스트 분석 — 국어 지문 분석, 영어 단어 분석, 요약/카드/용어/개념/퀴즈
- ✅ 드래그 영역 또는 페이지 전체 단위 분석 (전 과목)
- ✅ 학습 기록·통계(과목별 시간/점수)·맞춤형 추천
- ✅ 수식 저장소·영어 단어장
- ✅ tRPC 타입 안전 API (superjson 직렬화), TanStack Query 캐싱
- ✅ 라이트 테마 일관 디자인 (대시보드·기록·학습 페이지 디자인 통일)

> AI 기능은 OpenAI / Google(Gemini) / Anthropic(Claude) / Ollama(로컬 GPU) 중 하나의 공급자를 설정하면 동작하며, 설정이 없으면 예시(mock) 데이터로 대체됩니다. [AI 공급자 설정](#ai-공급자-설정) 참조.

### ⚠️ 데모 수준의 제약

- **비밀번호가 평문으로 저장·비교됩니다.** 학습/해커톤 데모 기준이며, 실서비스로 올리려면 bcrypt 등 해시가 필수입니다. (회원가입 페이지에 경고 배너로 명시)

### 개발 예정

- ⏳ 비밀번호 해시(bcrypt) 적용
- ⏳ 이용약관·개인정보 처리방침 실제 문서 (현재 푸터에서 "준비 중" 토스트로만 처리)
- ⏳ 퀴즈 세션/답안 상세 기록 (`quiz_sessions`, `quiz_answers` 테이블 활용)
- ⏳ 통계 대시보드 차트 시각화

## 기술 스택

### Frontend

| 기술 | 용도 |
|------|------|
| React 19 | UI 프레임워크 |
| TypeScript 5.9 | 정적 타입 |
| Vite 7 | 빌드 도구 |
| Tailwind CSS 4 | 스타일링 |
| shadcn/ui (Radix) | UI 컴포넌트 |
| tRPC 11 | 타입 안전 API 클라이언트 |
| TanStack Query | 서버 상태 관리 |
| Wouter | 라우팅 |
| pdfjs-dist | 클라이언트 PDF 렌더링 |

### Backend

| 기술 | 용도 |
|------|------|
| Express 4 | HTTP 서버 |
| tRPC 11 (superjson) | 타입 안전 RPC |
| Drizzle ORM + drizzle-kit | DB 접근 (MySQL 방언) |
| MySQL 8.4 호환 | DB (로컬: Docker / 운영: TiDB Cloud) |
| Zod | 입력 검증 |
| Cloudinary | PDF 원본 저장 |
| `node:crypto` | TOTP 구현 (외부 의존성 없음) |

### DevTools

| 기술 | 용도 |
|------|------|
| Vitest | 단위/통합 테스트 |
| ESBuild | 서버 번들링 |
| Prettier | 코드 포맷팅 |
| pnpm 10 | 패키지 매니저 |

## 프로젝트 구조

```
School_Learning/
├── client/                          # 프론트엔드 (Vite root)
│   └── src/
│       ├── main.tsx                 # 진입점 (tRPC + superjson)
│       ├── App.tsx                  # 라우팅 (로그인 상태로 메인 분기)
│       ├── pages/
│       │   ├── Home.tsx             # 홍보 페이지 (비로그인 메인)
│       │   ├── DashboardPage.tsx    # 로그인 메인 (통계 + 과목 바로가기)
│       │   ├── LoginPage.tsx        # 아이디/비밀번호/TOTP 로그인
│       │   ├── SignupPage.tsx       # 회원가입
│       │   ├── AccountPage.tsx      # 계정 설정 (TOTP 켜기/끄기)
│       │   ├── SubjectSelectPage.tsx# 과목 선택 (/subjects)
│       │   ├── KoreanStudyPage.tsx  # 국어 지문 분석 + 공통 도구
│       │   ├── EnglishStudyPage.tsx # 영어 단어 분석 + 공통 도구
│       │   ├── MathStudyPage.tsx    # 수학 수식 분석 · 답지 · 공통 도구
│       │   ├── ScienceStudyPage.tsx # 탐구 개념 정리 (공통 도구)
│       │   ├── StudyRecordsPage.tsx # 학습 기록·통계·추천
│       │   └── NotFound.tsx
│       ├── components/
│       │   ├── MaterialUploadButton.tsx     # 공용 PDF 업로드 버튼
│       │   ├── SubjectGrid.tsx              # 공용 과목 카드 그리드
│       │   ├── EnglishHighlighter.tsx
│       │   ├── MathVisualizer.tsx
│       │   ├── BlankQuiz.tsx
│       │   ├── study/
│       │   │   ├── StudyShell.tsx           # 학습 페이지 공통 셸(3분할 레이아웃)
│       │   │   ├── PdfViewer.tsx            # PDF 렌더 + 드래그 영역/텍스트 추출
│       │   │   ├── MaterialsPanel.tsx       # 좌측 파일 목록
│       │   │   └── SharedStudyTools.tsx     # 공통 AI 학습 도구
│       │   └── ui/                          # shadcn 컴포넌트
│       ├── hooks/
│       │   ├── useMaterialUpload.ts
│       │   └── useAnswerSheet.ts            # 문제/답지 지정·전환
│       ├── lib/
│       │   ├── api.ts                       # apiUrl() — VITE_API_URL 기반
│       │   ├── trpc.ts / storage.ts / pdf.ts / subjects.ts
│       ├── contexts/ThemeContext.tsx
│       └── _core/hooks/useAuth.ts           # me + logout
│
├── server/                          # 백엔드 (Express + tRPC)
│   ├── _core/
│   │   ├── index.ts                 # 진입점·미들웨어·에러 핸들러
│   │   ├── db.ts                    # Drizzle + mysql2 풀 (TLS 지원)
│   │   ├── context.ts               # 인증 컨텍스트 (쿠키 세션)
│   │   ├── totp.ts                  # RFC 6238 TOTP (node:crypto)
│   │   ├── routes.ts                # REST 라우트 (업로드/AI)
│   │   └── ai.ts                    # AI 공급자 추상화
│   ├── routers/                     # tRPC 라우터 (auth/materials/mathAssist/studyRecords)
│   ├── schema.ts                    # Drizzle 스키마 (테이블 8개)
│   └── migrations/
│
├── shared/                          # 프론트/백엔드 공용 타입·상수
├── docker-compose.yml               # 로컬/단일호스트 스택
├── render.yaml / netlify.toml       # 배포 정의
├── PROJECT.md                       # 아키텍처·배포·의사결정 기록
├── DEPLOYMENT_GUIDE.md / DOCKER_GUIDE.md
└── README.md
```

## 설치 및 실행

### 🐳 Docker로 실행 (권장)

Docker만 있으면 웹 + API + MySQL 전체 스택을 한 번에 띄웁니다:

```bash
cp .env.example .env    # OPENAI_API_KEY, CLOUDINARY_* 등 필요한 값 입력
docker compose up -d --build
# → http://localhost:8080  (nginx가 SPA 서빙 + /api 프록시)
```

nginx가 `/api/`를 백엔드로 프록시하므로 CORS·쿠키 문제가 없습니다. 자세한 내용은 [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) 참조.

### 직접 실행

**필수 요구사항:** Node.js 18+, pnpm 10+

```bash
git clone https://github.com/Nokna0/School_Learning.git
cd School_Learning
pnpm install
cp .env.example .env.local   # 값 채우기 (아래 환경 변수 설정 참조)
```

**개발 서버 (터미널 2개):**

```bash
pnpm dev          # 백엔드 :3000 (.env.local 자동 로드)
pnpm dev:client   # 프론트 :5173 (vite proxy로 /api → :3000)
```

**빌드 / 실행:**

```bash
pnpm build
pnpm start
```

## 환경 변수 설정

`.env.example`를 복사해서 사용합니다(도커: `.env`, 직접 실행: `.env.local`). 주요 값만 정리하면:

```env
# 서버
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173     # 와일드카드(*) 금지, 끝 슬래시 금지
REQUIRE_AUTH=                          # 비우면 비로그인=로컬 기본 사용자로 동작

# 클라이언트 (VITE_ 접두사만 번들에 주입됨)
VITE_APP_TITLE=EduTech
VITE_API_URL=                          # 단일 오리진(도커)에서는 반드시 비울 것

# 데이터베이스 (자료/학습 기록 기능에 필요)
DATABASE_URL=mysql://edutech:edutech@localhost:3306/edutech
DATABASE_SSL=                          # 관리형 MySQL(TiDB 등) TLS일 때만 true

# AI 공급자 (openai | google | anthropic | ollama)
AI_PROVIDER=openai
OPENAI_API_KEY=

# Cloudinary (PDF 업로드)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

> **주의**
> - `VITE_API_URL`은 **빌드 시점에 번들에 박힙니다.** 값을 바꾸면 프론트를 재빌드해야 반영됩니다.
> - `CORS_ORIGIN`에 `*`를 쓰면 안 됩니다(클라이언트가 `credentials: "include"`를 사용). 끝에 슬래시도 붙이지 마세요.
> - 단일 오리진 배포(도커/nginx)에서는 `VITE_API_URL`을 **반드시 비워야** 상대 경로로 호출됩니다.

### 인증 동작

- 기본값은 로그인 없이 **로컬 기본 사용자**(`local-user`)로 동작합니다. 분석 기능은 쓸 수 있지만 학습 기록은 쌓이지 않습니다.
- 아이디/비밀번호로 로그인하면 세션 쿠키(`edutech_uid`)가 발급되고, 이후 대시보드/통계가 계정에 연동됩니다.
- `REQUIRE_AUTH=true`면 세션 쿠키 없이는 보호된 프로시저에 접근할 수 없습니다.

## AI 공급자 설정

AI 기능은 4가지 공급자 중 하나를 선택해 씁니다. **모든 공급자를 OpenAI 표준 API(chat.completions)로 통일 호출**하므로 공급자를 바꿔도 서버 코드는 동일합니다. `.env`에서 `AI_PROVIDER`로 선택합니다.

| `AI_PROVIDER` | 필요한 설정 | 기본 모델 | 비고 |
|---------------|------------|-----------|------|
| `openai` (기본) | `OPENAI_API_KEY` | `gpt-4o-mini` | |
| `google` | `GOOGLE_API_KEY` | `gemini-2.5-flash` | Gemini의 OpenAI 호환 엔드포인트 |
| `anthropic` | `ANTHROPIC_API_KEY` | `claude-opus-4-8` | Claude의 OpenAI 호환 엔드포인트 |
| `ollama` | Ollama 설치 (키 불필요) | `llama3.2` | 로컬 GPU 사용 |

모델은 `AI_MODEL`(공통) 또는 공급자별 변수(`OPENAI_MODEL` 등)로 바꿀 수 있습니다. 현재 설정은 `GET /api/ai/status`로 확인합니다.

### Ollama로 로컬 GPU 사용하기

API 키 없이 사용자 컴퓨터의 GPU로 실행할 수 있습니다. [Ollama](https://ollama.com/download) 설치 후:

```bash
ollama pull llama3.2              # 텍스트용
ollama pull llama3.2-vision      # (선택) 이미지 분석용 — OCR/수식 추출에 필요

# .env
# AI_PROVIDER=ollama
# OLLAMA_MODEL=llama3.2
# OLLAMA_VISION_MODEL=llama3.2-vision
```

서버는 Ollama의 OpenAI 호환 엔드포인트(`http://localhost:11434/v1`)로 요청합니다. Docker로 서버를 띄우면 컨테이너가 `host.docker.internal`로 호스트의 Ollama에 자동 연결됩니다(compose 기본 설정).

## API 엔드포인트

### tRPC 라우터

```typescript
// auth — 계정/세션/2단계 인증
trpc.auth.me.useQuery()            // 비로그인이면 null 반환
trpc.auth.register.useMutation()   // { username, password }
trpc.auth.login.useMutation()      // { username, password, token? }  token = TOTP 코드
trpc.auth.logout.useMutation()
trpc.auth.setupTotp.useMutation()  // 시크릿/otpauth URI 발급
trpc.auth.enableTotp.useMutation() // { token } 코드 확인 후 활성화
trpc.auth.disableTotp.useMutation()

// materials — 자료 관리
trpc.materials.list.useQuery({ subject: 'math' })
trpc.materials.upload.useMutation()  // { subject, fileName, fileUrl, fileKey, fileSize }
trpc.materials.rename.useMutation()  // { id, fileName }
trpc.materials.setRole.useMutation() // { id, role: 'question' | 'answer' }
trpc.materials.delete.useMutation()  // { id } — Cloudinary 원본까지 삭제

// mathAssist — 문제 접근 가이드
trpc.mathAssist.questionHelp.useMutation() // { text } → { keyConcepts, approachSteps, ... }

// studyRecords — 기록/통계/저장소
trpc.studyRecords.list.useQuery()
trpc.studyRecords.create.useMutation()          // { subject, duration, score?, materialId?, notes? }
trpc.studyRecords.getStats.useQuery()           // 총 시간/평균 점수 + 과목별 통계
trpc.studyRecords.getRecommendations.useQuery()
trpc.studyRecords.getMathFormulas.useQuery()
trpc.studyRecords.saveMathFormula.useMutation() // { expression, description?, type?, color? }
trpc.studyRecords.deleteMathFormula.useMutation()
trpc.studyRecords.getEnglishWords.useQuery()
trpc.studyRecords.saveEnglishWord.useMutation() // { word, meaning, definition?, difficulty?, ... }
trpc.studyRecords.deleteEnglishWord.useMutation()
```

> tRPC는 `/trpc`와 `/api/trpc` 양쪽에 마운트됩니다.

### REST API

| Method | 엔드포인트 | 설명 | 비고 |
|--------|-----------|------|------|
| POST | `/api/upload` | PDF → Cloudinary (multer, 50MB) | `CLOUDINARY_*` 필요 |
| GET | `/api/download?key=` | 파일 서명 URL 조회 | |
| POST | `/api/math-analyze` | 수학 이미지 분석 (수식 LaTeX 추출) | AI(비전) |
| POST | `/api/ocr` | 이미지 텍스트 인식 | AI(비전) |
| POST | `/api/answer-explain` | 답지 단계별 설명 생성 | AI(비전) |
| POST | `/api/quiz-generate` | 퀴즈 자동 생성 | AI |
| POST | `/api/summarize` | 핵심 요약 + 요점 (모든 과목) | AI |
| POST | `/api/flashcards` | 암기 플래시카드 (모든 과목) | AI |
| POST | `/api/key-terms` | 핵심 용어 정리 (모든 과목) | AI |
| POST | `/api/concept-explain` | 개념 쉽게 풀이 (모든 과목) | AI |
| POST | `/api/korean-analyze` | 국어 지문 분석 | AI |
| POST | `/api/english-analyze` | 영어 어려운 단어 분석 | AI |
| GET | `/api/word-definition?word=` | 단어 정의/발음/예문 | AI |
| POST | `/api/generate` | 단순 텍스트 생성 (스트리밍 기본) | AI |
| GET | `/api/ai/status` | 현재 AI 공급자/모델 상태 | |
| GET | `/api/pdf-proxy?u=` | PDF 프록시 (Cloudinary 호스트만 허용) | |
| GET | `/health` | 헬스체크 (DB를 타지 않음) | |

> AI 엔드포인트는 공급자 미설정 시 예시(mock) 응답을 반환합니다.

#### `/api/generate` 사용법

기본값은 **실시간 스트리밍**(SSE, OpenAI 표준 chunk 형식)이며, 전체 응답을 한 번에 받으려면 `stream: false`를 지정합니다.

```bash
# 스트리밍 (기본값)
curl -N -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "광합성을 한 문단으로 설명해줘"}'

# 비스트리밍
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "광합성을 한 문단으로 설명해줘", "stream": false}'
```

## 개발 가이드

### 새 업로드 진입점을 만들 때

모든 업로드는 `components/MaterialUploadButton.tsx`를 거칩니다(Cloudinary 업로드 + DB 저장 + 캐시 무효화가 한 곳에). fetch를 직접 짜지 말고 이 컴포넌트를 재사용하세요.

### tRPC 라우터 추가

```typescript
// server/routers/myRouter.ts
import { router, publicProcedure } from "../_core/trpc.js";
import { z } from "zod";

export const myRouter = router({
  getData: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => ({ data: input.id })),
});

// server/routers/index.ts 의 appRouter 에 등록
```

### 검증 명령

```bash
pnpm check    # tsc --noEmit (타입 체크)
pnpm test     # vitest
pnpm build    # 클라이언트 + 서버 번들
pnpm format   # prettier
```

## 배포

현재 **월 비용 0원** 무료 티어로 운영 중입니다.

```
브라우저 → Netlify(정적 SPA) → Render(Express, 싱가포르)
                                   ├── TiDB Cloud (MySQL, 싱가포르, TLS)
                                   ├── Cloudinary (PDF 원본)
                                   └── OpenAI (분석/퀴즈)
```

| 구성 | 서비스 | 설정 |
|------|--------|------|
| 프론트 | Netlify | `netlify.toml` |
| 백엔드 | Render 무료 웹서비스 | `render.yaml` |
| DB | TiDB Cloud Starter | 대시보드 |
| 파일 | Cloudinary Free | 대시보드 |

- 백엔드는 **상시 실행 서버**여야 합니다(50MB PDF 업로드 + 10~30초 AI 비전 호출 때문에 서버리스 불가).
- Render 무료 서비스는 15분 무접속 시 잠들고 다음 요청에 30~60초 걸립니다. UptimeRobot이 `/health`를 주기적으로 깨워둡니다.
- 아키텍처·배포 의사결정·삽질 기록은 [PROJECT.md](./PROJECT.md), 단일 VPS/도커 배포는 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 참조.

## 문제 해결

### PDF가 렌더링되지 않습니다

PDF.js worker는 `client/src/lib/pdf.ts`에서 번들 파일로 설정됩니다. PDF를 다루는 코드에 아래 두 import가 모두 있어야 합니다:

```typescript
import * as pdfjsLib from "pdfjs-dist";
import "@/lib/pdf"; // worker 설정 (필수)
```

도커에서 PDF가 "1 / 0" 빈 화면이면 nginx의 `.mjs` MIME 설정 문제입니다(`docker/nginx.conf`에서 처리됨). 워커가 `immutable` 캐시라 수정 후 **하드 리프레시(Ctrl+Shift+R)**가 필요합니다.

### 업로드가 500 에러입니다

`CLOUDINARY_*` 값이 비어 있는 경우가 대부분입니다. `docker compose`는 `.env`를, `pnpm dev`는 `.env.local`을 읽습니다. 파일 위치와 키 값을 확인하세요. 같은 `fileKey`로 두 번 저장하면 UNIQUE 제약으로 실패합니다.

### 로그인 관련 쿼리가 깨집니다

`users` 테이블에 로그인 컬럼(`username`/`password`/`totp_*`)이 있어야 합니다. 운영 DB(TiDB)에 마이그레이션(`0001_open_domino.sql`)을 적용했는지 확인하세요. 절차는 PROJECT.md의 §8 참조.

### 환경 변수가 로드되지 않습니다

`.env.local`(직접 실행) 또는 `.env`(도커)가 루트에 있는지 확인하고 서버를 재시작하세요. `VITE_*`는 빌드 시점에 주입되므로 프론트는 재빌드가 필요합니다.

## 라이선스

MIT License — [LICENSE](./LICENSE) 참조

## 연락처

- GitHub: [@Nokna0](https://github.com/Nokna0)

---

**마지막 업데이트**: 2026년 7월 15일
