import { trpc } from "@/lib/trpc";
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

export default function ScienceStudyPage() {
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasSelection, setHasSelection] = useState(false);
  const viewerRef = useRef<PdfViewerHandle>(null);

  const { data: materialsData } = trpc.materials.list.useQuery({ subject: "science" });
  const materials: StudyMaterial[] = Array.isArray(materialsData) ? materialsData : [];

  const { visibleMaterials, mode, setMode, handleSelect, designate } =
    useAnswerSheet<StudyMaterial>({
      materials,
      selected: selectedMaterial,
      setSelected: setSelectedMaterial,
      setPage: setCurrentPage,
    });

  const tools = (
    <div className="space-y-3">
      {selectedMaterial && (
        <p className="text-xs text-muted-foreground">
          PDF에서 원하는 부분을 드래그하면 그 영역만, 드래그하지 않으면 페이지 전체를 분석합니다.
          {hasSelection && (
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {" "}
              현재 드래그 영역을 분석합니다.
            </span>
          )}
        </p>
      )}
      <SharedStudyTools
        subject="science"
        getText={() => viewerRef.current?.getText() ?? ""}
        hasMaterial={!!selectedMaterial}
      />
    </div>
  );

  return (
    <StudyShell
      subject="science"
      materials={visibleMaterials}
      selectedMaterial={selectedMaterial}
      onSelect={(m) => handleSelect(m as StudyMaterial)}
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
