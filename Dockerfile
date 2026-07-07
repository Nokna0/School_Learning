# syntax=docker/dockerfile:1

# ==================== 1. 의존성 설치 ====================
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ==================== 2. 빌드 (클라이언트 + 서버) ====================
FROM deps AS build
WORKDIR /app
COPY . .

# 클라이언트 빌드 시점에 주입되는 환경 변수 (필요 시 --build-arg 로 변경)
ARG VITE_APP_TITLE=EduTech
ARG VITE_API_URL=
ENV VITE_APP_TITLE=$VITE_APP_TITLE \
    VITE_API_URL=$VITE_API_URL

# dist/public (클라이언트) + dist/index.js (서버) 생성
RUN pnpm run build

# ==================== 3. API 서버 런타임 ====================
FROM node:22-alpine AS server
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist/index.js ./dist/index.js
EXPOSE 3000
CMD ["node", "dist/index.js"]

# ==================== 4. 웹 (nginx: 정적 파일 + API 프록시) ====================
FROM nginx:alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/public /usr/share/nginx/html
EXPOSE 80
