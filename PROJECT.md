# PROJECT.md

EduTech(School_Learning) 프로젝트의 구조, 배포 아키텍처, 그리고 무료 배포에 이르기까지의 의사결정 기록.

> 최종 갱신: 2026-07-14
> 라이브: 프론트 <https://nokchamaru.netlify.app> / API <https://edutech-api-sh3f.onrender.com>

---

## 1. 이 앱이 하는 일

PDF 학습 자료(수학·영어·화학)를 올리면 AI가 분석해 주는 학습 도구.

- PDF 업로드 → Cloudinary에 저장, 메타데이터는 DB에
- **수학**: 페이지를 이미지로 렌더 → OCR/수식 분석 → 풀이 설명
- **영어**: 지문 분석 → 단어 하이라이트 → 단어 정의 조회 → 빈칸 퀴즈
- **화학**: 지문 기반 퀴즈 생성
- 학습 기록·통계·추천, 수식/단어 저장

---

## 2. 기술 스택

| 계층 | 기술 |
|---|---|
| 프론트 | React 19, Vite 7, TypeScript 5.9, Tailwind 4, wouter(라우팅), TanStack Query |
| UI | shadcn/ui (Radix 기반 컴포넌트 53개), lucide-react |
| API | Express 4 + tRPC 11 (superjson transformer) |
| ORM | Drizzle ORM + drizzle-kit (MySQL 방언) |
| DB | MySQL 8.4 호환 (로컬: 도커 MySQL / 운영: TiDB Cloud) |
| 파일 | Cloudinary (`resource_type: "raw"`로 PDF 저장) |
| AI | OpenAI SDK (openai / google / anthropic / ollama 전환 가능) |
| PDF | pdfjs-dist (클라이언트 렌더링) |
| 패키지 | pnpm 10.4.1 |

---

## 3. 디렉터리 구조

```
School_Learning/
├── client/                     # 프론트엔드 (Vite root)
│   ├── index.html
│   ├── public/_redirects       # Netlify SPA 폴백
│   └── src/
│       ├── main.tsx            # 진입점. tRPC 클라이언트 + superjson 설정
│       ├── App.tsx             # 라우팅
│       ├── const.ts            # APP_TITLE, 로그인 URL
│       ├── lib/
│       │   ├── api.ts          # ★ apiUrl() — VITE_API_URL 기반 API 베이스
│       │   ├── trpc.ts         # tRPC React 훅
│       │   ├── storage.ts      # storagePut/storageGet (업로드/다운로드)
│       │   ├── pdf.ts          # pdfjs 워커 설정
│       │   └── utils.ts
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── StudyPage.tsx           # 자료 업로드/선택
│       │   ├── MathStudyPage.tsx       # PDF 렌더 → OCR → 수식 분석
│       │   ├── EnglishStudyPage.tsx    # 지문 분석 → 단어 → 퀴즈
│       │   ├── ChemistryStudyPage.tsx  # 퀴즈 생성
│       │   ├── StudyRecordsPage.tsx    # 기록/통계
│       │   └── NotFound.tsx
│       ├── components/
│       │   ├── EnglishHighlighter.tsx  # 단어 하이라이트 + 정의 조회
│       │   ├── BlankQuiz.tsx
│       │   ├── MathVisualizer.tsx
│       │   ├── ErrorBoundary.tsx
│       │   └── ui/             # shadcn 컴포넌트 53개
│       ├── contexts/ThemeContext.tsx
│       └── _core/hooks/useAuth.ts
│
├── server/                     # 백엔드 (Express + tRPC)
│   ├── _core/
│   │   ├── index.ts            # 진입점. 미들웨어·라우트 마운트·에러 핸들러
│   │   ├── env.ts              # dotenv (.env.local 우선, 그다음 .env)
│   │   ├── db.ts               # ★ Drizzle + mysql2 풀 (DATABASE_SSL 지원)
│   │   ├── trpc.ts             # initTRPC + superjson, public/protectedProcedure
│   │   ├── context.ts          # 인증 컨텍스트 (userId)
│   │   ├── routes.ts           # REST 라우트 (업로드/AI)
│   │   └── ai.ts               # AI 공급자 추상화
│   ├── routers/                # tRPC 라우터
│   │   ├── index.ts            # appRouter 조립
│   │   ├── auth.ts             # me, logout
│   │   ├── materials.ts        # list, upload
│   │   ├── mathAssist.ts       # questionHelp
│   │   └── studyRecords.ts     # 기록/통계/추천/수식/단어 (11개 프로시저)
│   ├── schema.ts               # Drizzle 스키마 (테이블 8개)
│   └── migrations/             # drizzle-kit 생성 SQL
│
├── shared/                     # 프론트/백엔드 공용 타입·상수
│
├── docker-compose.yml          # 로컬/단일호스트 스택 (db + migrate + server + web)
├── compose.prod.yml            # 프로덕션 오버레이 (Caddy 자동 HTTPS)
├── Dockerfile                  # 멀티스테이지: deps → build → server / web
├── docker/nginx.conf           # SPA 서빙 + /api 리버스 프록시
├── docker/Caddyfile            # 자동 HTTPS 리버스 프록시
│
├── render.yaml                 # ★ Render 배포 정의 (백엔드, 무료 티어)
├── netlify.toml                # ★ Netlify 배포 정의 (프론트)
├── drizzle.config.ts           # ★ 마이그레이션 설정 (TLS 지원)
├── vite.config.ts
├── .env.example                # 환경변수 템플릿
└── .env.local                  # 실제 시크릿 (gitignore됨, 커밋 금지)
```

★ = 이번 작업에서 새로 만들거나 크게 고친 파일

---

## 4. 데이터 모델 (테이블 8개)

`server/schema.ts` 기준. **외래키는 하나도 없음** — 이 사실이 나중에 TiDB 호환성을 보장해 준 근거가 됐다.

| 테이블 | 용도 | 주의점 |
|---|---|---|
| `users` | 사용자 | |
| `materials` | 업로드한 PDF 메타데이터 | **`file_key`에 UNIQUE 제약** ← 같은 키 재삽입 시 중복 에러 |
| `study_records` | 학습 기록 | |
| `quiz_sessions` / `quiz_answers` | 퀴즈 세션·답안 | |
| `math_formulas` | 저장한 수식 | |
| `english_words` | 저장한 영단어 | |
| `study_statistics` | 학습 통계 | |

PDF **원본은 DB에 없다.** Cloudinary에 있고 DB에는 `file_url` / `file_key`만 저장한다.

---

## 5. API 표면

### REST (`/api/*` — `server/_core/routes.ts`)

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/upload` | PDF → Cloudinary (multer, 50MB 제한) |
| GET | `/api/download` | fileKey → 서명 URL |
| POST | `/api/math-analyze` | 이미지 → 수식 분석 |
| POST | `/api/ocr` | 이미지 → 텍스트 |
| POST | `/api/answer-explain` | 이미지 → 풀이 설명 |
| POST | `/api/quiz-generate` | 지문 → 퀴즈 |
| POST | `/api/english-analyze` | 지문 → 영어 분석 |
| GET | `/api/word-definition` | 단어 정의 |
| GET | `/api/pdf-proxy` | Cloudinary PDF 프록시 (호스트 화이트리스트 있음) |
| GET | `/api/ai/status` | AI 공급자 상태 |
| GET | `/health` | 헬스체크 (**DB를 타지 않음**) |

### tRPC (`/trpc` 와 `/api/trpc` 양쪽에 마운트)

- `auth.me` (public) / `auth.logout` (protected)
- `materials.list` (public, `subject` 필수) / `materials.upload` (protected)
- `mathAssist.questionHelp` (protected)
- `studyRecords.*` — list, create, getStats, getRecommendations, getMathFormulas, saveMathFormula, deleteMathFormula, getEnglishWords, saveEnglishWord, deleteEnglishWord

---

## 6. 배포 아키텍처 (현재 운영 중)

```
                    브라우저
                       │
                       ▼
        https://nokchamaru.netlify.app          ← Netlify (정적 SPA, CDN, 무료)
                       │  VITE_API_URL 로 절대주소 호출
                       ▼
   https://edutech-api-sh3f.onrender.com        ← Render (Express, 싱가포르, 무료)
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   TiDB Cloud      Cloudinary      OpenAI
   (싱가포르,        (PDF 원본,       (분석/퀴즈)
    무료, TLS)        무료)
```

**월 비용 0원.**

### 각 구성요소

| 구성 | 서비스 | 설정 위치 | 무료 한도 |
|---|---|---|---|
| 프론트 | Netlify | `netlify.toml` | 대역폭 100GB/월 |
| 백엔드 | Render 무료 웹서비스 (싱가포르) | `render.yaml` | 인스턴스 750시간/월 |
| DB | TiDB Cloud Starter (싱가포르, AWS) | 대시보드 | 5GiB + 50M RU/월 |
| 파일 | Cloudinary Free | 대시보드 | 크레딧 25/월 |

### 왜 이 구성인가 (핵심 제약)

- **백엔드는 반드시 "상시 실행되는 서버"여야 한다.** Vercel/Netlify Functions 같은 서버리스는 **요청 본문 4.5~6MB 제한**과 **실행시간 10초 제한**이 있는데, 이 앱은 **50MB PDF 업로드**와 **10~30초 걸리는 AI 비전 호출**이 핵심이라 둘 다 넘긴다. → 서버리스 불가.
- **DB를 서버 밖으로 빼야 무료가 된다.** MySQL이 RAM을 먹는 주범이라, DB를 TiDB(외부 무료)로 빼면 Express 혼자는 512MB로 충분해져 Render 무료 티어에 들어간다.
- **PDF는 서버를 거쳐 간다.** 클라이언트가 Cloudinary로 직접 올리지 않고 `/api/upload`를 통과한다. 그래서 서버 리전이 사용자와 멀면 업로드가 느려진다 → 유럽(Hetzner) 대신 아시아 리전 선택.
- **TiDB와 Render를 같은 싱가포르 리전에** 두었다. DB 왕복이 0.4초 → 실측 확인함.

### 콜드 스타트 대응

Render 무료 서비스는 **15분 무접속 시 잠들고, 다음 요청에 30~60초** 걸린다(실측 32.8초).

- **UptimeRobot이 `/health`를 10분마다 호출**해 깨워둔다.
- `/health`만 찔러야 한다. tRPC를 찌르면 **TiDB의 무료 RU 쿼터를 10분마다 갉아먹는다.**
- 31일 = 744시간 < 750시간이라 24시간 깨워둬도 쿼터 안에 들어온다. **단 무료 웹서비스가 1개일 때만.** 2개를 동시에 깨워두면 그 달 남은 기간 정지된다.

---

## 7. 환경변수

| 키 | 로컬(`.env.local`) | Render | Netlify |
|---|---|---|---|
| `DATABASE_URL` | TiDB URL | ✅ (시크릿) | — |
| `DATABASE_SSL` | `true` | ✅ (`render.yaml`에 하드코딩) | — |
| `CORS_ORIGIN` | `http://localhost:5173` | **`https://nokchamaru.netlify.app`** | — |
| `OPENAI_API_KEY` | ✅ | ✅ (시크릿) | — |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | ✅ | ✅ (시크릿) | — |
| `AI_PROVIDER` | `openai` | `openai` | — |
| `VITE_API_URL` | **비움** (상대경로) | — | **`https://edutech-api-sh3f.onrender.com`** |

**함정 3개:**
1. `VITE_API_URL`은 **빌드 시점에 번들에 박힌다.** Netlify에서 값을 바꾸면 **재배포**해야 반영된다.
2. `CORS_ORIGIN`에 **`*`를 쓰면 안 된다.** 클라이언트가 `credentials: "include"`를 쓰기 때문에 브라우저가 와일드카드를 거부한다. **끝에 슬래시도 붙이면 안 된다.**
3. 단일 오리진 배포(도커)에서는 `VITE_API_URL`을 **반드시 비워야** 한다. 비어 있으면 상대경로(`/api/...`)로 호출하고 nginx가 프록시한다.

---

## 8. 로컬 개발

### 도커 (풀스택, 단일 오리진)

```bash
cp .env.example .env      # DB 비밀번호 등 채우기
docker compose up -d --build
# → http://localhost:8080  (nginx가 SPA 서빙 + /api 프록시)
```

nginx가 `/api/`를 `server:3000`으로 프록시하므로 **CORS도 쿠키 문제도 없다.**

### 도커 없이

```bash
pnpm install
pnpm dev            # 서버 :3000  (.env.local 자동 로드)
pnpm dev:client     # 클라이언트 :5173 (vite proxy로 /api → :3000)
```

### DB 마이그레이션

```powershell
# TiDB 대상 (로컬에서 실행. Render 무료 플랜은 pre-deploy 명령을 지원하지 않음)
$env:DATABASE_URL = "mysql://<user>:<pw>@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/edutech"
$env:DATABASE_SSL = "true"
npx pnpm db:push
```

### 기타

```bash
pnpm check     # tsc --noEmit
pnpm test      # vitest
pnpm build     # 클라이언트 + 서버 번들
```

---

## 9. 이번 작업에서 실제로 고친 것들

### 9.1 REST 호출 9곳이 `VITE_API_URL`을 무시하고 있었다

`fetch("/api/upload")` 처럼 **상대경로가 하드코딩**돼 있었다. tRPC만 `VITE_API_URL`을 존중했다. 프론트/백엔드를 다른 도메인에 배포하는 순간 **모든 업로드·OCR·퀴즈 호출이 404**가 났을 것이다.

→ `client/src/lib/api.ts`의 `apiUrl()`을 만들고 9곳 전부 교체 + `credentials: "include"` 추가.
대상: `lib/storage.ts`(2), `MathStudyPage.tsx`(4), `EnglishStudyPage.tsx`(2), `ChemistryStudyPage.tsx`(1), `StudyPage.tsx`(1), `EnglishHighlighter.tsx`(1), `main.tsx`(tRPC URL).

### 9.2 도커 헬스체크가 IPv6로 붙어서 서버가 영원히 unhealthy

`docker-compose.yml`의 헬스체크가 `wget http://localhost:3000/health` 였다. 컨테이너 `/etc/hosts`에 `::1 localhost`가 있어 busybox wget이 **IPv6를 먼저 시도**하는데, Express는 `0.0.0.0`(IPv4)에만 바인딩돼 있어 `Connection refused`. 서버는 멀쩡한데 `unhealthy`로 남고, `web`이 `condition: service_healthy`를 기다리므로 **`docker compose up`이 애초에 완주된 적이 없었다.**

→ `127.0.0.1`로 변경.

### 9.3 drizzle-kit이 TLS 옵션을 무시했다

`dbCredentials`에 `url`을 주면 drizzle-kit은 **`ssl` 옵션을 무시한다.** TiDB는 평문 접속을 거부하므로 `db:push`가 실패했다.

→ `drizzle.config.ts`에서 `DATABASE_SSL=true`일 때 URL을 host/port/user/password/database로 **분해**해서 넘기도록 수정.
(런타임 `db.ts`는 문제없음 — mysql2는 `uri`와 명시 옵션을 병합할 때 **명시 옵션을 우선**한다. `connection_config.js`의 `if (options[key]) continue;`)

### 9.4 Cloudflare 시도 → 폐기

처음엔 Cloudflare Workers에 배포하려 했으나:
- `wrangler.jsonc`가 없어 `wrangler deploy`가 대화형 자동설정으로 빠졌고, `assets.directory`가 빠진 설정을 스스로 생성해 **매번 빌드 실패**
- 근본적으로 **Express + mysql2(TCP) 앱은 Workers에서 못 돈다**

→ Cloudflare 폐기. 관련 파일 삭제함.

---

## 10. 삽질 기록 (같은 실수 반복 방지)

| 증상 | 진짜 원인 |
|---|---|
| `assets` 설정 에러로 Cloudflare 빌드 실패 | 설정 파일이 없어서 wrangler가 자동 생성한 잘못된 설정 |
| `docker compose up`이 web까지 안 감 | 헬스체크 IPv6/IPv4 불일치 (§9.2) |
| `db:push` — "insecure transport prohibited" | drizzle-kit이 url 방식에선 ssl 무시 (§9.3) |
| TiDB `ER_ACCESS_DENIED` | `.env.local`의 **비밀번호 플레이스홀더를 안 바꿨음** (`여기에_비밀번호`가 URL 인코딩되어 들어가 있었다) |
| Cloudinary 업로드 403 (ping은 성공) | **API 키에 권한이 하나도 없었음.** ping은 권한이 필요 없어서 "자격증명 정상"으로 오인됨 → admin 권한 부여로 해결 |
| Render `/api/trpc`가 404, AI가 mock 응답 | **엉뚱한 서비스를 테스트하고 있었다.** 워크스페이스에 서비스가 여러 개 있었고(`-0jah`, `-sh3f`), 실제 배포본은 `-sh3f` |
| `materials.upload`가 500 (간헐적) | **앱 버그 아님.** `file_key`가 UNIQUE인데 테스트에서 같은 키를 반복 삽입 (§4). 실제 업로드는 `${Date.now()}-${파일명}`이라 충돌 안 함 |
| PowerShell에서 curl JSON이 깨짐 | PS 5.1이 따옴표를 망가뜨림 → 페이로드를 파일로 넘겨야 함 (`-d "@file.json"`) |

---

## 11. 검증 완료 항목 (2026-07-14 실측)

브라우저가 실제로 보내는 요청을 그대로 재현해서 확인함.

| 검사 | 결과 |
|---|---|
| Netlify SPA 로딩 / 딥링크 폴백 | 200 |
| 번들에 `VITE_API_URL` 주입 | 확인됨 |
| CORS 프리플라이트 (Netlify 오리진) | 204, 오리진 정확히 반영, `allow-credentials: true` |
| `/health` | 200 (콜드 스타트 32.8초 → 워밍 후 0.4초) |
| `auth.me` (tRPC batch) | 200 |
| `materials.list` (math/english/chemistry) | 전부 200 |
| Render → TiDB 쿼리 | 200, **0.4초** (동일 리전) |
| Render → OpenAI | 200, 실제 응답 |
| Render → Cloudinary PDF 업로드 | 200 |
| **업로드 → DB 저장 → 목록 반영 전체 흐름** | **200** |

검증에 쓴 테스트 데이터(TiDB 3행, Cloudinary 4개 파일)는 **키를 명시해서 삭제 완료**. 현재 자료 목록은 빈 상태.

---

## 12. 발표 대비 체크리스트

무료 티어에는 SLA가 없다. 발표 무대에 무료 티어를 그대로 올리지 말 것.

**발표 10분 전:**
1. 앱 열기 → 로그인 → **자료 목록까지 띄우기** (Render와 TiDB **둘 다** 깨워야 한다. `/health`만으론 TiDB가 안 깨어난다)
2. PDF 하나 열어서 AI 분석까지 한 번 돌려보기

**백업 (반드시 준비):**
- **데모 영상 녹화** 1개
- 최후의 보루: 노트북에서 `docker compose up -d` → `http://localhost:8080` (네트워크·플랫폼 장애와 무관하게 동작. 검증 완료)
- 심사위원이 직접 접속할 URL이 필요하면: `docker run --rm --network host cloudflare/cloudflared tunnel --url http://localhost:8080` → 즉석 HTTPS 주소 발급

**확실성을 원하면:** 발표 기간만 Render 유료($7/월)로 올렸다가 끝나고 내리면 며칠치만 청구된다.

---

## 13. 대안 배포 경로 (레포에 남아 있음)

무료 티어를 벗어나야 할 때를 위해 남겨둔 것들.

| 파일 | 용도 |
|---|---|
| `docker-compose.yml` + `compose.prod.yml` + `docker/Caddyfile` | **단일 VPS 배포.** Caddy가 자동 HTTPS, nginx가 SPA+API 프록시, MySQL 포함. `DOMAIN`/`ACME_EMAIL`만 채우면 `docker compose -f docker-compose.yml -f compose.prod.yml up -d --build` |
| `Dockerfile` | 멀티스테이지 (deps → build → server / web) |

VPS를 쓴다면 **RAM 2GB 이상** 필요하다 (Vite 빌드 + MySQL 동시 실행 시 1GB는 OOM). 부족하면 스왑 2GB를 붙이거나 이미지를 로컬에서 빌드해 레지스트리 경유로 배포한다.

---

## 14. 주의사항 모음

- **`.env.local`은 절대 커밋 금지.** `.gitignore`의 `.env.*` 규칙으로 막혀 있다 (`.env.example`만 예외).
- **Render 무료 웹서비스는 1개만 유지.** 2개를 깨워두면 750시간 쿼터가 터진다.
- **UptimeRobot은 `/health`만.** tRPC를 찌르면 TiDB RU를 소모한다.
- **Render 무료 서버의 디스크는 휘발성.** 재배포마다 초기화되므로 파일을 로컬 디스크에 저장하면 안 된다 (그래서 Cloudinary를 쓴다).
- **`file_key`는 UNIQUE.** 같은 키로 두 번 저장하면 실패한다.
- **TiDB 클러스터를 새로 만들지 말 것.** 기존 `edutech` 클러스터(싱가포르)에 테이블 8개가 이미 있다.
- `tsconfig.json`에 `"ignoreDeprecations": "6.0"`을 넣으면 **TS 5.9가 거부해서 타입체크 전체가 깨진다.** (한 번 들어왔다가 제거함)
