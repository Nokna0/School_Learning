export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO = "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

// 앱 내부의 로그인 페이지 경로. (예전 OAuth 포털 리다이렉트를 대체)
export const getLoginUrl = () => "/login";
