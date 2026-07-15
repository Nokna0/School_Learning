import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiUrl } from "@/lib/api";
import { trpc } from "@/lib/trpc";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";
import StudyShell from "@/components/study/StudyShell";
import PdfViewer from "@/components/study/PdfViewer";
import SharedStudyTools from "@/components/study/SharedStudyTools";
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

export default function EnglishStudyPage() {
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const pdfTextRef = useRef("");

  const [highlightedWords, setHighlightedWords] = useState<WordData[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const { data: materialsData } = trpc.materials.list.useQuery({ subject: "english" });
  const materials: StudyMaterial[] = Array.isArray(materialsData) ? materialsData : [];

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

  const tools = (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground">영어 도구</p>
      <Button
        onClick={handleAnalyzeEnglish}
        disabled={analyzing || !selectedMaterial}
        className="w-full justify-start gap-2 bg-sky-600 hover:bg-sky-700"
      >
        {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        어려운 단어 분석
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

      <div className="border-t pt-3">
        <SharedStudyTools
          subject="english"
          getText={() => pdfTextRef.current}
          hasMaterial={!!selectedMaterial}
        />
      </div>
    </div>
  );

  return (
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
  );
}
