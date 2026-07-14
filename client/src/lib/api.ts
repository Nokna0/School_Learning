/**
 * 백엔드 API 기본 URL.
 *
 * - 비어 있으면(로컬 dev, Docker 단일 오리진) 상대 경로를 그대로 사용합니다.
 *   dev 서버는 vite.config.ts 의 proxy 로 /api → localhost:3000 을 전달합니다.
 * - Cloudflare 처럼 클라이언트만 정적 배포하는 경우 VITE_API_URL 에
 *   백엔드 오리진(예: https://edutech-api.onrender.com)을 넣으면 됩니다.
 */
export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

/** apiUrl("/api/upload") → "/api/upload" 또는 "https://backend/api/upload" */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
