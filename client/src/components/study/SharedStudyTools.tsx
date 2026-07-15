import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  X,
  FileText,
  Layers,
  Tags,
  Lightbulb,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";
import { trpc } from "@/lib/trpc";
import BlankQuiz from "@/components/BlankQuiz";
import type { SubjectKey } from "@/lib/subjects";

interface Summary {
  summary: string;
  keyPoints: string[];
}
interface Flashcard {
  front: string;
  back: string;
}
interface Term {
  term: string;
  definition: string;
}
interface Concept {
  name: string;
  explanation: string;
  example?: string;
}
interface QuizQuestion {
  id: string;
  type: "fill-in-the-blank" | "multiple-choice" | "short-answer";
  question: string;
  blanks?: string[];
  options?: string[];
  correctAnswer: string | string[];
  difficulty: "easy" | "medium" | "hard";
  explanation?: string;
}

const SUBJECT_LABEL: Record<SubjectKey, string> = {
  english: "영어",
  math: "수학",
  science: "탐구",
  korean: "국어",
};

/**
 * 모든 과목이 공통으로 쓰는 AI 학습 도구 모음.
 * 현재 PDF 페이지의 텍스트(getText)를 재료로 요약·플래시카드·핵심 용어·개념 풀이·백지 퀴즈를 생성한다.
 * 과목별 특화 도구(영어 단어 하이라이트, 수학 수식 분석 등)는 각 페이지에서 별도로 렌더한다.
 */
export default function SharedStudyTools({
  subject,
  getText,
  hasMaterial,
}: {
  subject: SubjectKey;
  getText: () => string;
  hasMaterial: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [terms, setTerms] = useState<Term[] | null>(null);
  const [concepts, setConcepts] = useState<Concept[] | null>(null);

  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const createRecordMutation = trpc.studyRecords.create.useMutation();

  // 공통 fetch 헬퍼 — 텍스트가 없으면 안내 후 중단한다.
  const runTool = async <T,>(
    key: string,
    path: string,
    onDone: (data: T) => void,
    extra?: Record<string, unknown>,
  ) => {
    const text = getText();
    if (!text.trim()) {
      toast.info("이 페이지에서 분석할 텍스트를 찾지 못했습니다.");
      return;
    }
    setLoading(key);
    try {
      const res = await fetch(apiUrl(path), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, subject, ...extra }),
      });
      if (!res.ok) throw new Error(`서버 응답 ${res.status}`);
      onDone(await res.json());
    } catch (e) {
      console.error(`${key} error:`, e);
      toast.error("요청에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(null);
    }
  };

  const handleSummarize = () =>
    runTool<Summary>("summary", "/api/summarize", (d) => {
      setSummary({ summary: d.summary ?? "", keyPoints: d.keyPoints ?? [] });
    });

  const handleFlashcards = () =>
    runTool<{ cards: Flashcard[] }>("cards", "/api/flashcards", (d) => {
      const list = d.cards ?? [];
      if (list.length === 0) return toast.info("카드를 만들지 못했습니다.");
      setCards(list);
      setCardIndex(0);
      setCardFlipped(false);
    });

  const handleKeyTerms = () =>
    runTool<{ terms: Term[] }>("terms", "/api/key-terms", (d) => {
      const list = d.terms ?? [];
      if (list.length === 0) return toast.info("용어를 찾지 못했습니다.");
      setTerms(list);
    });

  const handleConcepts = () =>
    runTool<{ concepts: Concept[] }>("concepts", "/api/concept-explain", (d) => {
      const list = d.concepts ?? [];
      if (list.length === 0) return toast.info("개념을 찾지 못했습니다.");
      setConcepts(list);
    });

  const handleQuiz = async () => {
    const text = getText();
    if (!text.trim()) {
      toast.info("이 페이지에서 퀴즈로 만들 텍스트를 찾지 못했습니다.");
      return;
    }
    setLoading("quiz");
    try {
      const res = await fetch(apiUrl("/api/quiz-generate"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfText: text, subject }),
      });
      if (!res.ok) throw new Error(`서버 응답 ${res.status}`);
      const data = await res.json();
      const questions: QuizQuestion[] = Array.isArray(data)
        ? data
        : data.questions || [];
      if (questions.length === 0)
        return toast.info("퀴즈를 생성하지 못했습니다. 다시 시도해 주세요.");
      setQuizData(questions);
      setShowQuiz(true);
    } catch (e) {
      console.error("Quiz generation error:", e);
      toast.error("퀴즈 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(null);
    }
  };

  const ToolButton = ({
    id,
    icon,
    label,
    onClick,
  }: {
    id: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }) => (
    <Button
      variant="outline"
      className="w-full justify-start gap-2"
      onClick={onClick}
      disabled={!hasMaterial || loading !== null}
    >
      {loading === id ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </Button>
  );

  const card = cards?.[cardIndex];

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground">공통 학습 도구</p>

      <ToolButton id="summary" icon={<FileText className="h-4 w-4" />} label="핵심 요약" onClick={handleSummarize} />
      <ToolButton id="cards" icon={<Layers className="h-4 w-4" />} label="암기 플래시카드" onClick={handleFlashcards} />
      <ToolButton id="terms" icon={<Tags className="h-4 w-4" />} label="핵심 용어 정리" onClick={handleKeyTerms} />
      <ToolButton id="concepts" icon={<Lightbulb className="h-4 w-4" />} label="개념 쉽게 풀이" onClick={handleConcepts} />
      <Button
        className="w-full justify-start gap-2 bg-indigo-600 hover:bg-indigo-700"
        onClick={handleQuiz}
        disabled={!hasMaterial || loading !== null}
      >
        {loading === "quiz" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        백지 퀴즈 생성
      </Button>

      {/* ===== 요약 결과 ===== */}
      {summary && (
        <Card className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">📝 핵심 요약</p>
            <button onClick={() => setSummary(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm leading-relaxed">{summary.summary}</p>
          {summary.keyPoints.length > 0 && (
            <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
              {summary.keyPoints.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* ===== 플래시카드 ===== */}
      {cards && card && (
        <Card className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">🃏 플래시카드</p>
            <button onClick={() => setCards(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setCardFlipped((v) => !v)}
            className="flex min-h-[7rem] w-full items-center justify-center rounded-lg border bg-muted/40 p-4 text-center text-sm leading-relaxed transition-colors hover:bg-muted"
          >
            {cardFlipped ? card.back : card.front}
          </button>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <button
              className="disabled:opacity-40"
              disabled={cardIndex === 0}
              onClick={() => {
                setCardIndex((i) => Math.max(0, i - 1));
                setCardFlipped(false);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>{cardFlipped ? "정답" : "문제"} · {cardIndex + 1} / {cards.length}</span>
            <button
              className="disabled:opacity-40"
              disabled={cardIndex >= cards.length - 1}
              onClick={() => {
                setCardIndex((i) => Math.min(cards.length - 1, i + 1));
                setCardFlipped(false);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {/* ===== 핵심 용어 ===== */}
      {terms && (
        <Card className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">📌 핵심 용어</p>
            <button onClick={() => setTerms(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {terms.map((t, i) => (
              <div key={i} className="rounded-md border p-2">
                <p className="text-sm font-semibold">{t.term}</p>
                <p className="text-xs text-muted-foreground">{t.definition}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ===== 개념 풀이 ===== */}
      {concepts && (
        <Card className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">💡 개념 풀이</p>
            <button onClick={() => setConcepts(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {concepts.map((c, i) => (
              <div key={i} className="rounded-md border p-2">
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{c.explanation}</p>
                {c.example && (
                  <p className="mt-1 text-xs italic text-muted-foreground">예) {c.example}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ===== 퀴즈 모달 ===== */}
      {showQuiz && quizData && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto bg-black/20 px-4 py-8 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl">
            <button className="absolute -top-6 right-0 text-white" onClick={() => setShowQuiz(false)}>
              <X className="h-6 w-6" />
            </button>
            <BlankQuiz
              questions={quizData}
              title={`${SUBJECT_LABEL[subject]} 퀴즈`}
              description="현재 페이지의 내용을 바탕으로 한 퀴즈입니다."
              estimatedTime={10}
              onContinue={() => setShowQuiz(false)}
              onComplete={(results) =>
                createRecordMutation.mutate({
                  subject,
                  duration: 10,
                  score: results.score,
                  notes: `퀴즈 ${results.totalQuestions}문항 중 ${results.correctAnswers}개 정답`,
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
