import { type ReactNode, useCallback, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUser,
  PanelLeftClose,
  PanelRightClose,
  Upload,
} from "lucide-react";
import { SUBJECTS, type SubjectKey } from "@/lib/subjects";
import MaterialsPanel, {
  displayName,
  type StudyMaterialLite,
} from "@/components/study/MaterialsPanel";
import { useMaterialUpload } from "@/hooks/useMaterialUpload";
import type { MaterialRole } from "@/hooks/useAnswerSheet";
import { cn } from "@/lib/utils";

// 좌·우 패널 너비 드래그 조절 범위(px).
const MIN_PANEL = 200;
const MAX_PANEL = 560;
const DEFAULT_LEFT = 256; // w-64
const DEFAULT_RIGHT = 320; // w-80

/**
 * 세 과목 공통 학습 셸.
 * 상단바(돌아가기 · 과목 전환 드롭다운 · 페이지 이동 · 계정)
 * + 좌측 파일목록(너비조절·접기·답지토글) + 중앙 PDF(드롭 업로드) + 우측 학습툴(너비조절·접기).
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
  mode = "question",
  onModeChange,
  onDesignate,
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
  /** 좌측 상단 문제/답지 토글 상태. */
  mode?: MaterialRole;
  onModeChange?: (mode: MaterialRole) => void;
  /** 자료를 문제↔답지로 수동 지정. */
  onDesignate?: (m: StudyMaterialLite, role: MaterialRole) => void;
}) {
  const label = SUBJECTS.find((s) => s.key === subject)?.label ?? subject;
  const [, setLocation] = useLocation();
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT);
  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT);
  const [dragOver, setDragOver] = useState(false);

  const { uploadFile } = useMaterialUpload(subject);

  const clamp = (px: number) => Math.min(MAX_PANEL, Math.max(MIN_PANEL, px));

  // 경계 드래그로 패널 너비 조절. side="left"는 오른쪽 이동 시 넓어지고,
  // side="right"는 왼쪽 이동 시 넓어진다.
  const startResize = useCallback(
    (side: "left" | "right") => (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = side === "left" ? leftWidth : rightWidth;
      const onMove = (ev: MouseEvent) => {
        const delta = side === "left" ? ev.clientX - startX : startX - ev.clientX;
        const setter = side === "left" ? setLeftWidth : setRightWidth;
        setter(clamp(startW + delta));
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.userSelect = "";
      };
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [leftWidth, rightWidth],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* ===== 상단바 ===== */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
        <div className="flex items-center gap-2">
          <Link href="/subjects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              이전 메뉴로
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

        {/* 과목 전환 드롭다운 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 font-semibold">
              <span className="min-w-0 truncate">
                {label} 학습
                {selectedMaterial && (
                  <span className="ml-1 font-normal text-muted-foreground">
                    · {displayName(selectedMaterial.fileName)}
                  </span>
                )}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {SUBJECTS.map((s) => (
              <DropdownMenuItem
                key={s.key}
                onSelect={() => setLocation(s.href)}
                className={cn(s.key === subject && "font-semibold text-indigo-600")}
              >
                <span className="mr-2">{s.emoji}</span>
                {s.label} 학습
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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
          {/* 계정 */}
          <Link href="/account">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="계정">
              <CircleUser className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* ===== 본문 3분할 ===== */}
      <div className="flex min-h-0 flex-1">
        {/* 좌측: 파일 목록 */}
        <aside
          className={cn(
            "flex shrink-0 flex-col overflow-hidden border-r bg-card",
            leftOpen ? "p-3" : "w-0 p-0",
          )}
          style={leftOpen ? { width: leftWidth } : undefined}
        >
          {leftOpen && (
            <>
              {/* 문제 / 답지 세그먼트 토글(좌측 상단) */}
              <div className="mb-3 grid shrink-0 grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                {(["question", "answer"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => onModeChange?.(m)}
                    className={cn(
                      "rounded-md py-1.5 text-sm font-medium transition-colors",
                      mode === m
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {m === "question" ? "문제" : "답지"}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <MaterialsPanel
                  subject={subject}
                  materials={materials}
                  selectedId={selectedMaterial?.id}
                  onSelect={onSelect}
                  emptyHint={
                    mode === "answer" ? "답지로 지정된 파일이 없습니다." : emptyHint
                  }
                  mode={mode}
                  onDesignate={onDesignate}
                />
              </div>
            </>
          )}
        </aside>
        {/* 좌측 너비 조절 핸들 */}
        {leftOpen && (
          <div
            onMouseDown={startResize("left")}
            className="w-1 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-indigo-400"
            title="크기 조절"
          />
        )}

        {/* 중앙: PDF (드롭 업로드) */}
        <main
          className="relative min-w-0 flex-1 overflow-hidden"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={handleDrop}
        >
          {children}
          {dragOver && (
            <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 border-4 border-dashed border-indigo-500 bg-indigo-50/80 text-indigo-700 backdrop-blur-sm">
              <Upload className="h-10 w-10" />
              <p className="text-lg font-semibold">여기로 PDF를 드롭하세요</p>
            </div>
          )}
        </main>

        {/* 우측 너비 조절 핸들 */}
        {rightOpen && (
          <div
            onMouseDown={startResize("right")}
            className="w-1 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-indigo-400"
            title="크기 조절"
          />
        )}
        {/* 우측: 학습 도구 */}
        <aside
          className={cn(
            "shrink-0 overflow-y-auto border-l bg-card",
            rightOpen ? "p-3" : "w-0 p-0",
          )}
          style={rightOpen ? { width: rightWidth } : undefined}
        >
          {rightOpen && tools}
        </aside>
      </div>
    </div>
  );
}
