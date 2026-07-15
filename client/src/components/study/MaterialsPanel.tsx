import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
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
}: {
  subject: SubjectKey;
  materials: StudyMaterialLite[];
  selectedId?: string | null;
  onSelect: (m: StudyMaterialLite) => void;
  emptyHint?: string;
}) {
  const utils = trpc.useUtils();
  const [pendingDelete, setPendingDelete] = useState<StudyMaterialLite | null>(null);

  const deleteMutation = trpc.materials.delete.useMutation({
    onSuccess: async () => {
      await utils.materials.list.invalidate();
      toast.success("파일을 삭제했습니다.");
    },
    onError: (e) => toast.error(`삭제 실패: ${e.message}`),
  });

  return (
    <div className="flex h-full flex-col gap-3">
      <MaterialUploadButton subject={subject} />

      <div className="flex-1 space-y-2 overflow-y-auto">
        {materials.length === 0 ? (
          <p className="px-1 pt-2 text-sm text-muted-foreground">{emptyHint}</p>
        ) : (
          materials.map((m) => {
            const active = m.id === selectedId;
            return (
              <div
                key={m.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg border p-2 transition-colors",
                  active ? "border-indigo-500 bg-indigo-50" : "hover:bg-muted",
                )}
              >
                <button
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => onSelect(m)}
                  title={displayName(m.fileName)}
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">{displayName(m.fileName)}</span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
                  onClick={() => setPendingDelete(m)}
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
