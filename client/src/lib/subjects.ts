// 네 과목 공통 메타데이터. Home / SubjectSelect / Dashboard 가 함께 쓴다.
export type SubjectKey = "english" | "math" | "science" | "korean";

export const SUBJECTS: {
  key: SubjectKey;
  label: string;
  emoji: string;
  href: string;
  description: string;
  detail: string;
}[] = [
  {
    key: "korean",
    label: "국어",
    emoji: "📖",
    href: "/korean",
    description: "지문 분석 및 어휘·문학 감상 학습",
    detail: "AI가 지문의 주제·정서·표현을 분석하고 어휘 풀이와 감상을 도와줍니다.",
  },
  {
    key: "english",
    label: "영어",
    emoji: "📚",
    href: "/english",
    description: "어려운 단어 학습 및 독해 능력 향상",
    detail: "AI가 감지한 어려운 단어를 하이라이트하고 한국어 뜻을 제공합니다.",
  },
  {
    key: "math",
    label: "수학",
    emoji: "📐",
    href: "/math",
    description: "함수식 시각화 및 동적 그래프 학습",
    detail: "수학 함수를 동적 그래프로 시각화하고 계수를 변경하며 학습합니다.",
  },
  {
    key: "science",
    label: "탐구",
    emoji: "🔬",
    href: "/science",
    description: "과학·사회 탐구 개념 정리 및 퀴즈 학습",
    detail: "탐구 교재를 분석해 핵심 개념을 정리하고 백지 퀴즈로 복습합니다.",
  },
];
