# 🐳 Docker 실행 가이드

이 프로젝트는 Docker Compose로 전체 스택(웹 + API 서버 + MySQL)을 한 번에 실행할 수 있습니다.

## 구성

| 서비스    | 역할                                        | 포트                  |
| --------- | ------------------------------------------- | --------------------- |
| `web`     | nginx — React 정적 파일 서빙 + API 프록시   | `8080` → 80           |
| `server`  | Express + tRPC API 서버                     | 내부 3000 (비공개)    |
| `db`      | MySQL 8.4                                   | `127.0.0.1:3306`      |
| `migrate` | drizzle-kit 마이그레이션 (일회성 실행 후 종료) | -                  |

요청 흐름: 브라우저 → `web`(nginx) → 정적 파일 또는 `/api/*`, `/api/trpc/*` 프록시 → `server` → `db`

## 빠른 시작

```bash
# 1. 환경 변수 설정 (API 키 입력)
cp .env.example .env
# .env 에서 OPENAI_API_KEY, CLOUDINARY_* 값을 채워주세요

# 2. 전체 스택 빌드 & 실행
docker compose up -d --build

# 3. 접속
open http://localhost:8080
```

마이그레이션(`migrate` 서비스)은 DB가 준비된 후 자동으로 실행되고, 완료되면 `server`가 시작됩니다.

## 환경 변수

`docker compose`는 프로젝트 루트의 `.env` 파일을 자동으로 읽습니다. 주요 변수:

| 변수                                                          | 기본값               | 설명                       |
| ------------------------------------------------------------- | -------------------- | -------------------------- |
| `AI_PROVIDER`                                                  | `openai`             | AI 공급자: `openai` / `google` / `anthropic` / `ollama`(로컬 GPU) |
| `OPENAI_API_KEY` / `GOOGLE_API_KEY` / `ANTHROPIC_API_KEY`      | (없음)               | 선택한 공급자의 API 키     |
| `OLLAMA_BASE_URL`                                              | `http://host.docker.internal:11434/v1` | 호스트 PC의 Ollama OpenAI 호환 엔드포인트 |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | (없음)    | PDF 업로드 저장에 필요     |
| `MYSQL_DATABASE`                                               | `edutech`            | DB 이름                    |
| `MYSQL_USER` / `MYSQL_PASSWORD`                                | `edutech` / `edutech` | 앱용 DB 계정              |
| `MYSQL_ROOT_PASSWORD`                                          | `root`               | MySQL root 비밀번호        |
| `CORS_ORIGIN`                                                  | `http://localhost:8080` | 허용 오리진             |

> `DATABASE_URL`은 compose가 위 MySQL 변수로 자동 구성하므로 따로 설정할 필요 없습니다.

## 자주 쓰는 명령어

```bash
docker compose up -d --build     # 빌드 후 백그라운드 실행
docker compose logs -f server    # API 서버 로그 확인
docker compose ps                # 상태 확인
docker compose down              # 중지 (데이터 유지)
docker compose down -v           # 중지 + DB 데이터까지 삭제
docker compose up -d --build server web   # 코드 변경 후 앱만 재빌드
docker compose run --rm migrate  # 마이그레이션 수동 재실행
```

## 로컬 개발에 DB만 쓰기

코드는 로컬에서 `pnpm dev`로 돌리고 MySQL만 Docker로 띄울 수도 있습니다:

```bash
docker compose up -d db

# .env 에 아래처럼 설정
# DATABASE_URL=mysql://edutech:edutech@127.0.0.1:3306/edutech

pnpm db:push   # 마이그레이션
pnpm dev       # 개발 서버 (http://localhost:3000)
```

## 로컬 GPU(Ollama) 사용

`AI_PROVIDER=ollama`로 설정하면 API 키 없이 **호스트 PC의 GPU**로 AI 기능을 실행합니다. 호스트에 [Ollama](https://ollama.com/download)를 설치하고 모델을 받아두세요:

```bash
ollama pull llama3.2             # 텍스트용
ollama pull llama3.2-vision     # (선택) 이미지 분석용
```

compose의 `server` 서비스에는 `host.docker.internal:host-gateway`가 설정되어 있어, 컨테이너가 호스트에서 실행 중인 Ollama(`localhost:11434`)에 자동으로 접근합니다. 별도 네트워크 설정은 필요 없습니다.

## 문제 해결

- **`web`이 502를 반환**: `server`가 아직 헬스체크를 통과하지 못한 상태입니다. `docker compose logs server`로 원인을 확인하세요.
- **DB 연결 실패**: 최초 실행 시 MySQL 초기화에 수십 초가 걸릴 수 있습니다. healthcheck가 통과할 때까지 `server`는 자동으로 대기합니다.
- **3306 포트 충돌**: 호스트에 이미 MySQL이 떠 있다면 `docker-compose.yml`의 `db.ports` 항목을 제거하거나 다른 포트로 변경하세요.
- **DB 스키마 초기화**: `docker compose down -v && docker compose up -d --build`
