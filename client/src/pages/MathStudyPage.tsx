import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap, BookOpen, X, BookmarkPlus, Check } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import MathVisualizer from "@/components/MathVisualizer";
import StudyShell from "@/components/study/StudyShell";
import PdfViewer, { type PdfViewerHandle } from "@/components/study/PdfViewer";
import SharedStudyTools from "@/components/study/SharedStudyTools";
import { useAnswerSheet } from "@/hooks/useAnswerSheet";

// data URL 접두사를 떼고 순수 base64만 남긴다(서버가 접두사를 다시 붙인다).
const rawBase64 = (dataUrl: string) => dataUrl.replace(/^data:image\/\w+;base64,/, "");

interface StudyMaterial {
  id: string;
  fileName: string;
  fileUrl: string;
  subject: string;
  role?: "question" | "answer" | null;
}

interface QuestionHelpResult {
  keyConcepts: string[];
  approachSteps: string[];
  cautionPoints: string[];
  phraseExplanations: { phrase: string; meaning: string }[];
}

interface MathExpression {
  latex?: string;
  description?: string;
}

export default function MathStudyPage() {
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasSelection, setHasSelection] = useState(false);

  const [mathExpressions, setMathExpressions] = useState<MathExpression[]>([]);
  const [graphDescriptions, setGraphDescriptions] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const [answerExplanation, setAnswerExplanation] = useState("");
  const [answerAnalyzing, setAnswerAnalyzing] = useState(false);

  const [questionHelp, setQuestionHelp] = useState<QuestionHelpResult | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideExpanded, setGuideExpanded] = useState(false);

  const [savedFormulas, setSavedFormulas] = useState<Set<string>>(new Set());

  const viewerRef = useRef<PdfViewerHandle>(null);

  const { data: materialsData } = trpc.materials.list.useQuery({ subject: "math" });
  const materials: StudyMaterial[] = Array.isArray(materialsData) ? materialsData : [];

  // 문제/답지 수동 지정 + 전환(세 과목 공통 훅).
  const { visibleMaterials, mode, setMode, isAnswerMode, handleSelect, designate } =
    useAnswerSheet<StudyMaterial>({
      materials,
      selected: selectedMaterial,
      setSelected: setSelectedMaterial,
      setPage: setCurrentPage,
    });

  const questionHelpMutation = trpc.mathAssist.questionHelp.useMutation();
  const saveFormulaMutation = trpc.studyRecords.saveMathFormula.useMutation({
    onSuccess: (_, variables) =>
      setSavedFormulas((prev) => new Set(prev).add(variables.expression)),
  });

  // 파일/페이지 바뀌면 분석 결과 초기화
  useEffect(() => {
    setMathExpressions([]);
    setGraphDescriptions([]);
    setQuestionHelp(null);
    setGuideExpanded(false);
    setAnswerExplanation("");
    setHasSelection(false);
  }, [selectedMaterial, currentPage]);

  // 드래그 영역이 있으면 그 부분을, 없으면 페이지 전체를 이미지로 가져온다.
  const getRegionOrPage = () => {
    const cropped = viewerRef.current?.cropSelectionOrFullPage();
    if (!cropped) {
      toast.info("먼저 교재를 선택하세요.");
      return null;
    }
    return cropped;
  };

  /* ===== 수식 분석 ===== */
  const analyzeSelection = async () => {
    const cropped = getRegionOrPage();
    if (!cropped) return;
    setAnalyzing(true);
    try {
      const res = await fetch(apiUrl("/api/math-analyze"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: rawBase64(cropped) }),
      });
      if (!res.ok) throw new Error(`서버 응답 ${res.status}`);
      const data = await res.json();
      const expressions: MathExpression[] = data.expressions || [];
      setMathExpressions(expressions);
      setGraphDescriptions(data.graphDescriptions || []);
      if (expressions.length === 0 && (!data.graphDescriptions || data.graphDescriptions.length === 0)) {
        toast.info("인식된 수식이 없습니다. 더 선명한 영역을 드래그해 보세요.");
      }
    } catch (e) {
      console.error(e);
      toast.error("수식 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setAnalyzing(false);
    }
  };

  /* ===== 문제 접근 가이드 ===== */
  const analyzeQuestionGuide = async () => {
    const cropped = getRegionOrPage();
    if (!cropped) return;
    setGuideLoading(true);
    try {
      const ocrRes = await fetch(apiUrl("/api/ocr"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: rawBase64(cropped) }),
      });
      if (!ocrRes.ok) throw new Error(`서버 응답 ${ocrRes.status}`);
      const ocr = await ocrRes.json();
      const text = (ocr?.text || "").trim();
      if (!text) {
        toast.error("문장을 인식하지 못했습니다. 더 선명한 영역을 드래그해 보세요.");
        return;
      }
      const result = await questionHelpMutation.mutateAsync({ text });
      setQuestionHelp(result);
      setGuideExpanded(true);
    } catch (e) {
      console.error(e);
      toast.error("문제 접근 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setGuideLoading(false);
    }
  };

  /* ===== 답지 상세 설명 ===== */
  const analyzeAnswerDetail = async () => {
    if (!isAnswerMode) {
      toast.info("먼저 '답지 보기'를 누른 뒤 답지에서 영역을 드래그하세요.");
      return;
    }
    const cropped = getRegionOrPage();
    if (!cropped) return;
    setAnswerAnalyzing(true);
    try {
      const res = await fetch(apiUrl("/api/answer-explain"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: rawBase64(cropped) }),
      });
      if (!res.ok) throw new Error(`서버 응답 ${res.status}`);
      const data = await res.json();
      setAnswerExplanation(data.explanation || "답지 해설 응답 형식이 예상과 다릅니다.");
    } catch (e) {
      console.error(e);
      toast.error("답지 상세 설명에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setAnswerAnalyzing(false);
    }
  };

  /* ===== 우측 도구 패널 ===== */
  const tools = (
    <div className="space-y-3">
      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        onClick={analyzeSelection}
        disabled={!selectedMaterial || analyzing}
      >
        {analyzing ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />분석 중...</>
        ) : (
          <><Zap className="mr-2 h-4 w-4" />{hasSelection ? "드래그 영역 수식 분석" : "페이지 수식 분석"}</>
        )}
      </Button>

      <Button
        className="w-full bg-green-600 hover:bg-green-700"
        onClick={analyzeQuestionGuide}
        disabled={!selectedMaterial || guideLoading}
      >
        {guideLoading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />분석 중...</>
        ) : (
          <><BookOpen className="mr-2 h-4 w-4" />문제 접근 가이드</>
        )}
      </Button>

      <Button
        className="w-full bg-amber-600 hover:bg-amber-700"
        onClick={analyzeAnswerDetail}
        disabled={!selectedMaterial || answerAnalyzing}
      >
        {answerAnalyzing ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />설명 생성 중...</>
        ) : (
          <><Zap className="mr-2 h-4 w-4" />답지 상세 설명</>
        )}
      </Button>

      {selectedMaterial && (
        <p className="text-xs text-muted-foreground">
          PDF에서 원하는 부분을 드래그하면 그 영역만, 드래그하지 않으면 페이지 전체를 분석합니다.
          빈 곳을 클릭하면 선택이 해제됩니다.
        </p>
      )}

      {/* 답지 설명 결과 */}
      {answerExplanation && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">답지 해설</CardTitle>
          </CardHeader>
          <CardContent className="max-h-60 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
            {answerExplanation}
          </CardContent>
        </Card>
      )}

      {/* 추출된 수식 */}
      {mathExpressions.filter((e) => e.latex).length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">추출된 수식</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mathExpressions
              .filter((e) => e.latex)
              .map((e, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-md border p-2">
                  <div className="min-w-0">
                    <div className="truncate font-mono text-sm">{e.latex}</div>
                    {e.description && (
                      <div className="text-xs text-muted-foreground">{e.description}</div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      saveFormulaMutation.mutate({
                        expression: e.latex!,
                        description: e.description,
                        type: "expression",
                      })
                    }
                    disabled={saveFormulaMutation.isPending || savedFormulas.has(e.latex!)}
                  >
                    {savedFormulas.has(e.latex!) ? (
                      <><Check className="mr-1 h-3 w-3" />저장됨</>
                    ) : (
                      <><BookmarkPlus className="mr-1 h-3 w-3" />저장</>
                    )}
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* 그래프 */}
      {mathExpressions.filter((e) => e.latex).length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">그래프</CardTitle>
          </CardHeader>
          <CardContent>
            <MathVisualizer
              initialExpressions={mathExpressions
                .filter((e) => e.latex)
                .map((e) => ({
                  expression: e.latex!,
                  type: "expression",
                  description: e.description,
                }))}
            />
          </CardContent>
        </Card>
      )}

      {/* 그래프 설명 */}
      {graphDescriptions.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">그래프 설명</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {graphDescriptions.map((g, i) => (
              <div key={i} className="border-b py-2 last:border-0">{g}</div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="border-t pt-3">
        <SharedStudyTools
          subject="math"
          getText={() => viewerRef.current?.getText() ?? ""}
          hasMaterial={!!selectedMaterial}
        />
      </div>
    </div>
  );

  return (
    <>
      <StudyShell
        subject="math"
        materials={visibleMaterials}
        selectedMaterial={selectedMaterial}
        onSelect={(m) => handleSelect(m as StudyMaterial)}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        tools={tools}
        emptyHint="업로드된 교재가 없습니다."
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

      {/* 문제 접근 가이드 팝업 */}
      {guideExpanded && questionHelp && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/20 px-6 py-8 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <button className="absolute right-4 top-4" onClick={() => setGuideExpanded(false)}>
              <X className="h-6 w-6" />
            </button>
            <h2 className="mb-8 text-3xl font-extrabold">문제 접근 가이드</h2>
            <div className="space-y-8 text-lg leading-relaxed">
              <section>
                <div className="mb-2 text-xl font-bold">🔍 핵심 개념</div>
                <ul className="ml-6 list-disc space-y-1">
                  {questionHelp.keyConcepts.map((k, i) => <li key={i}>{k}</li>)}
                </ul>
              </section>
              <section>
                <div className="mb-2 text-xl font-bold">📘 접근 단계</div>
                <ol className="ml-6 list-decimal space-y-1">
                  {questionHelp.approachSteps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </section>
              <section>
                <div className="mb-2 text-xl font-bold">⚠️ 주의할 점</div>
                <ul className="ml-6 list-disc space-y-1">
                  {questionHelp.cautionPoints.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </section>
              <section>
                <div className="mb-2 text-xl font-bold">✏️ 문제 표현의 의미</div>
                <ul className="ml-6 list-disc space-y-1">
                  {questionHelp.phraseExplanations.map((p, i) => (
                    <li key={i}><b>{p.phrase}</b>: {p.meaning}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
