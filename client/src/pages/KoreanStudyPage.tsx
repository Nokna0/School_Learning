import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiUrl } from "@/lib/api";
import { trpc } from "@/lib/trpc";
import { Loader2, ScrollText, X } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";
import StudyShell from "@/components/study/StudyShell";
import PdfViewer, { type PdfViewerHandle } from "@/components/study/PdfViewer";
import SharedStudyTools from "@/components/study/SharedStudyTools";
import { useAnswerSheet } from "@/hooks/useAnswerSheet";

interface StudyMaterial {
  id: string;
  fileName: string;
  fileUrl: string;
  subject: string;
  role?: "question" | "answer" | null;
}

interface PassageAnalysis {
  theme: string;
  tone: string;
  expressions: { expression: string; effect: string }[];
  vocabulary: { word: string; meaning: string }[];
}

export default function KoreanStudyPage() {
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasSelection, setHasSelection] = useState(false);
  const viewerRef = useRef<PdfViewerHandle>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PassageAnalysis | null>(null);

  const { data: materialsData } = trpc.materials.list.useQuery({ subject: "korean" });
  const materials: StudyMaterial[] = Array.isArray(materialsData) ? materialsData : [];

  const { visibleMaterials, mode, setMode, handleSelect, designate } =
    useAnswerSheet<StudyMaterial>({
      materials,
      selected: selectedMaterial,
      setSelected: setSelectedMaterial,
      setPage: setCurrentPage,
    });

  const handleAnalyzePassage = async () => {
    const text = viewerRef.current?.getText() ?? "";
    if (!text.trim()) {
      toast.info("이 페이지에서 분석할 지문을 찾지 못했습니다.");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch(apiUrl("/api/korean-analyze"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`서버 응답 ${res.status}`);
      const data = await res.json();
      setAnalysis({
        theme: data.theme ?? "",
        tone: data.tone ?? "",
        expressions: data.expressions ?? [],
        vocabulary: data.vocabulary ?? [],
      });
    } catch (e) {
      console.error("Korean analysis error:", e);
      toast.error("지문 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setAnalyzing(false);
    }
  };

  const tools = (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground">국어 도구</p>
      <Button
        className="w-full justify-start gap-2 bg-rose-600 hover:bg-rose-700"
        onClick={handleAnalyzePassage}
        disabled={!selectedMaterial || analyzing}
      >
        {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScrollText className="h-4 w-4" />}
        {hasSelection ? "드래그 영역 지문 분석" : "지문 분석"}
      </Button>
      {selectedMaterial && (
        <p className="text-xs text-muted-foreground">
          PDF에서 원하는 부분을 드래그하면 그 영역만, 드래그하지 않으면 페이지 전체를 분석합니다.
        </p>
      )}

      {analysis && (
        <Card className="space-y-3 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">📜 지문 분석</p>
            <button onClick={() => setAnalysis(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          {analysis.theme && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">주제 · 중심 내용</p>
              <p className="text-sm leading-relaxed">{analysis.theme}</p>
            </div>
          )}
          {analysis.tone && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">정서 · 어조</p>
              <p className="text-sm leading-relaxed">{analysis.tone}</p>
            </div>
          )}
          {analysis.expressions.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">표현 · 수사법</p>
              <div className="space-y-1">
                {analysis.expressions.map((e, i) => (
                  <div key={i} className="rounded-md border p-2 text-xs">
                    <span className="font-semibold">{e.expression}</span> — {e.effect}
                  </div>
                ))}
              </div>
            </div>
          )}
          {analysis.vocabulary.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">어휘 풀이</p>
              <div className="space-y-1">
                {analysis.vocabulary.map((v, i) => (
                  <div key={i} className="rounded-md border p-2 text-xs">
                    <span className="font-semibold">{v.word}</span>: {v.meaning}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="border-t pt-3">
        <SharedStudyTools
          subject="korean"
          getText={() => viewerRef.current?.getText() ?? ""}
          hasMaterial={!!selectedMaterial}
        />
      </div>
    </div>
  );

  return (
    <StudyShell
      subject="korean"
      materials={visibleMaterials}
      selectedMaterial={selectedMaterial}
      onSelect={(m) => {
        handleSelect(m as StudyMaterial);
        setAnalysis(null);
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
          ref={viewerRef}
          fileUrl={selectedMaterial.fileUrl}
          page={currentPage}
          onTotalPages={setTotalPages}
          enableSelection
          onSelectionChange={setHasSelection}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          왼쪽에서 파일을 선택하거나 업로드하세요.
        </div>
      )}
    </StudyShell>
  );
}
