import { trpc } from "@/lib/trpc";
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

export default function ScienceStudyPage() {
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const pdfTextRef = useRef("");

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
    <SharedStudyTools
      subject="science"
      getText={() => pdfTextRef.current}
      hasMaterial={!!selectedMaterial}
    />
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
