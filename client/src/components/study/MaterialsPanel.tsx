import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileCheck2, FileText, FileX2, Pencil, Trash2 } from "lucide-react";
import type { MaterialRole } from "@/hooks/useAnswerSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MaterialUploadButton from "@/components/MaterialUploadButton";
import { cn } from "@/lib/utils";
import type { SubjectKey } from "@/lib/subjects";

export interface StudyMaterialLite {
  id: string;
  fileName: string;
  fileUrl: string;
  subject: string;
  role?: MaterialRole | null;
}

// 파일명에서 .pdf 확장자를 숨긴다.
export function displayName(name: string) {
  return name.replace(/\.pdf$/i, "");
}

export default function MaterialsPanel({
  subject,
  materials,
  selectedId,
  onSelect,
  emptyHint = "업로드된 파일이 없습니다.",
  mode = "question",
  onDesignate,
}: {
  subject: SubjectKey;
  materials: StudyMaterialLite[];
  selectedId?: string | null;
  onSelect: (m: StudyMaterialLite) => void;
  emptyHint?: string;
  /** 현재 목록이 문제/답지 중 무엇을 보여주는지. 역할 지정 버튼 방향을 결정한다. */
  mode?: MaterialRole;
  /** 자료를 문제↔답지로 수동 지정. */
  onDesignate?: (m: StudyMaterialLite, role: MaterialRole) => void;
}) {
  const utils = trpc.useUtils();
  const [pendingDelete, setPendingDelete] = useState<StudyMaterialLite | null>(null);

  // 인라인 이름 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const deleteMutation = trpc.materials.delete.useMutation({
    onSuccess: async () => {
      await utils.materials.list.invalidate();
      toast.success("파일을 삭제했습니다.");
    },
    onError: (e) => toast.error(`삭제 실패: ${e.message}`),
  });

  const renameMutation = trpc.materials.rename.useMutation({
    onSuccess: async () => {
      await utils.materials.list.invalidate();
    },
    onError: (e) => toast.error(`이름 변경 실패: ${e.message}`),
  });

  const startEditing = (m: StudyMaterialLite) => {
    setEditingId(m.id);
    setDraftName(displayName(m.fileName));
    // 입력창이 마운트된 뒤 포커스/전체선택
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftName("");
  };

  const commitEditing = (m: StudyMaterialLite) => {
    const trimmed = draftName.trim();
    cancelEditing();
    if (!trimmed || trimmed === displayName(m.fileName)) return;
    // 표시명만 편집하므로 확장자(.pdf)를 다시 붙여 저장한다.
    renameMutation.mutate({ id: m.id, fileName: `${trimmed}.pdf` });
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <MaterialUploadButton subject={subject} />

      <div className="flex-1 space-y-2 overflow-y-auto">
        {materials.length === 0 ? (
          <p className="px-1 pt-2 text-sm text-muted-foreground">{emptyHint}</p>
        ) : (
          materials.map((m) => {
            const active = m.id === selectedId;
            const editing = m.id === editingId;
            return (
              <div
                key={m.id}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (editing) return;
                  if (e.key === "F2") {
                    e.preventDefault();
                    startEditing(m);
                  }
                }}
                className={cn(
                  "group flex items-center gap-2 rounded-lg border p-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400",
                  active ? "border-indigo-500 bg-indigo-50" : "hover:bg-muted",
                )}
              >
                {editing ? (
                  <Input
                    ref={inputRef}
                    value={draftName}
                    autoFocus
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={() => commitEditing(m)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitEditing(m);
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        cancelEditing();
                      }
                    }}
                    className="h-7 flex-1 text-sm"
                  />
                ) : (
                  <>
                    <button
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      onClick={() => onSelect(m)}
                      onDoubleClick={() => startEditing(m)}
                      title="클릭: 열기 · 더블클릭/F2: 이름 수정"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm">{displayName(m.fileName)}</span>
                    </button>
                    {onDesignate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-indigo-600"
                        onClick={() =>
                          onDesignate(m, mode === "question" ? "answer" : "question")
                        }
                        title={mode === "question" ? "답지로 지정" : "문제로 지정"}
                      >
                        {mode === "question" ? (
                          <FileCheck2 className="h-4 w-4" />
                        ) : (
                          <FileX2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
                      onClick={() => startEditing(m)}
                      title="이름 수정 (F2)"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
                      onClick={() => setPendingDelete(m)}
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>파일을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete && displayName(pendingDelete.fileName)}" 파일이 목록과
              저장소에서 영구 삭제됩니다. 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) deleteMutation.mutate({ id: pendingDelete.id });
                setPendingDelete(null);
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
