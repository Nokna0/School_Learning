import { type ReactNode, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
import { SUBJECTS, type SubjectKey } from "@/lib/subjects";
import MaterialsPanel, {
  displayName,
  type StudyMaterialLite,
} from "@/components/study/MaterialsPanel";
import { cn } from "@/lib/utils";

/**
 * 세 과목 공통 학습 셸.
 * 상단바(돌아가기 · 과목/파일명 · 이전/다음) + 좌측 파일목록 + 중앙 PDF + 우측 학습툴.
 */
export default function StudyShell({
  subject,
  materials,
  selectedMaterial,
  onSelect,
  page,
  totalPages,
  onPageChange,
  tools,
  children,
  emptyHint,
}: {
  subject: SubjectKey;
  materials: StudyMaterialLite[];
  selectedMaterial: StudyMaterialLite | null;
  onSelect: (m: StudyMaterialLite) => void;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  tools: ReactNode;
  children: ReactNode;
  emptyHint?: string;
}) {
  const label = SUBJECTS.find((s) => s.key === subject)?.label ?? subject;
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* ===== 상단바 ===== */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
        <div className="flex items-center gap-2">
          <Link href="/subjects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              돌아가기
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setLeftOpen((v) => !v)}
            title={leftOpen ? "파일 목록 접기" : "파일 목록 펼치기"}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <span>{label} 학습</span>
          {selectedMaterial && (
            <span className="truncate text-muted-foreground">
              · {displayName(selectedMaterial.fileName)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedMaterial && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                이전
              </Button>
              <span className="min-w-[3.5rem] text-center text-sm tabular-nums">
                {page} / {totalPages || "–"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages || page, page + 1))}
                disabled={!!totalPages && page >= totalPages}
              >
                다음
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setRightOpen((v) => !v)}
            title={rightOpen ? "학습 도구 접기" : "학습 도구 펼치기"}
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ===== 본문 3분할 ===== */}
      <div className="flex min-h-0 flex-1">
        {/* 좌측: 파일 목록 */}
        <aside
          className={cn(
            "shrink-0 overflow-hidden border-r bg-card transition-all duration-200",
            leftOpen ? "w-64 p-3" : "w-0 p-0",
          )}
        >
          {leftOpen && (
            <MaterialsPanel
              subject={subject}
              materials={materials}
              selectedId={selectedMaterial?.id}
              onSelect={onSelect}
              emptyHint={emptyHint}
            />
          )}
        </aside>

        {/* 중앙: PDF */}
        <main className="min-w-0 flex-1 overflow-hidden">{children}</main>

        {/* 우측: 학습 도구 */}
        <aside
          className={cn(
            "shrink-0 overflow-y-auto border-l bg-card transition-all duration-200",
            rightOpen ? "w-80 p-3" : "w-0 p-0",
          )}
        >
          {rightOpen && tools}
        </aside>
      </div>
    </div>
  );
}
