import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiUrl } from "@/lib/api";
import { trpc } from "@/lib/trpc";
import { Loader2, Zap, X } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";
import BlankQuiz from "@/components/BlankQuiz";
import StudyShell from "@/components/study/StudyShell";
import PdfViewer from "@/components/study/PdfViewer";
import { useAnswerSheet } from "@/hooks/useAnswerSheet";

interface StudyMaterial {
  id: string;
  fileName: string;
  fileUrl: string;
  subject: string;
  role?: "question" | "answer" | null;
}

interface WordData {
  word: string;
  koreanMeaning: string;
  englishDefinition: string;
  difficulty: "easy" | "medium" | "hard";
  partOfSpeech: string;
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

export default function EnglishStudyPage() {
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const pdfTextRef = useRef("");

  const [highlightedWords, setHighlightedWords] = useState<WordData[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  const { data: materialsData } = trpc.materials.list.useQuery({ subject: "english" });
  const materials: StudyMaterial[] = Array.isArray(materialsData) ? materialsData : [];
  const createRecordMutation = trpc.studyRecords.create.useMutation();

  const { visibleMaterials, mode, setMode, handleSelect, designate } =
    useAnswerSheet<StudyMaterial>({
      materials,
      selected: selectedMaterial,
      setSelected: setSelectedMaterial,
      setPage: setCurrentPage,
    });

  const handleAnalyzeEnglish = async () => {
    const text = pdfTextRef.current;
    if (!text.trim()) {
      toast.info("이 페이지에서 분석할 텍스트를 찾지 못했습니다.");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch(apiUrl("/api/english-analyze"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`서버 응답 ${res.status}`);
      const data = await res.json();
      const words: WordData[] = data.words || [];
      setHighlightedWords(words);
      if (words.length === 0) toast.info("이 페이지에서 강조할 단어를 찾지 못했습니다.");
    } catch (e) {
      console.error("English analysis error:", e);
      toast.error("단어 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateQuiz = async () => {
    const text = pdfTextRef.current;
    if (!text.trim()) {
      toast.info("이 페이지에서 퀴즈로 만들 텍스트를 찾지 못했습니다.");
      return;
    }
    setGeneratingQuiz(true);
    try {
      const res = await fetch(apiUrl("/api/quiz-generate"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfText: text, subject: "english" }),
      });
      if (!res.ok) throw new Error(`서버 응답 ${res.status}`);
      const data = await res.json();
      const questions: QuizQuestion[] = Array.isArray(data) ? data : data.questions || [];
      if (questions.length === 0) {
        toast.info("퀴즈를 생성하지 못했습니다. 다시 시도해 주세요.");
        return;
      }
      setQuizData(questions);
      setShowQuiz(true);
    } catch (e) {
      console.error("Quiz generation error:", e);
      toast.error("퀴즈 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const tools = (
    <div className="space-y-3">
      <Button onClick={handleAnalyzeEnglish} disabled={analyzing || !selectedMaterial} className="w-full gap-2">
        {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        현재 페이지 분석
      </Button>

      {highlightedWords.length > 0 && (
        <div className="space-y-2">
          {highlightedWords.map((word) => (
            <Card key={word.word} className="p-3">
              <p className="text-sm font-semibold">{word.word}</p>
              <p className="text-xs text-muted-foreground">{word.koreanMeaning}</p>
            </Card>
          ))}
        </div>
      )}

      <Button onClick={handleGenerateQuiz} disabled={generatingQuiz || !selectedMaterial} className="w-full gap-2">
        {generatingQuiz ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        백지 퀴즈 생성
      </Button>
    </div>
  );

  return (
    <>
      <StudyShell
        subject="english"
        materials={visibleMaterials}
        selectedMaterial={selectedMaterial}
        onSelect={(m) => {
          handleSelect(m as StudyMaterial);
          setHighlightedWords([]);
        }}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        tools={tools}
        mode={mode}
        onModeChange={setMode}
        onDesignate={(m, role) => designate(m as StudyMaterial, role)}
      >
        {selectedMaterial ? (
          <PdfViewer
            fileUrl={selectedMaterial.fileUrl}
            page={currentPage}
            onTotalPages={setTotalPages}
            onText={(t) => (pdfTextRef.current = t)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            왼쪽에서 파일을 선택하거나 업로드하세요.
          </div>
        )}
      </StudyShell>

      {showQuiz && quizData && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto bg-black/20 px-4 py-8 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl">
            <button
              className="absolute -top-6 right-0 text-white"
              onClick={() => setShowQuiz(false)}
            >
              <X className="h-6 w-6" />
            </button>
            <BlankQuiz
              questions={quizData}
              title="영어 퀴즈"
              description="현재 페이지의 내용을 바탕으로 한 퀴즈입니다."
              estimatedTime={10}
              onContinue={() => setShowQuiz(false)}
              onComplete={(results) =>
                createRecordMutation.mutate({
                  subject: "english",
                  duration: 10,
                  score: results.score,
                  notes: `퀴즈 ${results.totalQuestions}문항 중 ${results.correctAnswers}개 정답`,
                })
              }
            />
          </div>
        </div>
      )}
    </>
  );
}
