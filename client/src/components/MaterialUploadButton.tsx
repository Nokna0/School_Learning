import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/api";
import { trpc } from "@/lib/trpc";
import { Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Subject = "english" | "math" | "chemistry";

// 서버(multer, express.json)의 50MB 제한과 동일하게 맞춘다.
const MAX_SIZE = 50 * 1024 * 1024;

/**
 * PDF 업로드. 파일 선택/드래그앤드롭 → Cloudinary 업로드(/api/upload) → DB 저장(materials.upload)
 * → materials.list 캐시 무효화까지 한 번에 처리한다. 업로드 중 취소(AbortController) 지원.
 * 과목 페이지(영어/수학/화학)가 공통으로 사용한다.
 *
 * mode="dropzone": 드래그앤드롭을 받는 넓은 영역(사이드바용).
 * mode="button": 컴팩트 버튼만(헤더용).
 */
export default function MaterialUploadButton({
  subject,
  variant = "default",
  className,
  mode = "dropzone",
  onUploaded,
}: {
  subject: Subject;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
  mode?: "button" | "dropzone";
  onUploaded?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const uploadMutation = trpc.materials.upload.useMutation();
  const utils = trpc.useUtils();

  const uploadFile = useCallback(
    async (file: File) => {
      // 중복 제출 가드: 업로드 중이면 무시한다.
      if (uploading) return;

      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        toast.error("PDF 파일만 업로드할 수 있습니다.");
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error("파일이 너무 큽니다. 50MB 이하 PDF만 업로드할 수 있습니다.");
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setUploading(true);
      const toastId = toast.loading(`"${file.name}" 업로드 중...`);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subject", subject);

        const res = await fetch(apiUrl("/api/upload"), {
          method: "POST",
          credentials: "include",
          body: formData,
          signal: controller.signal,
        });
        if (!res.ok) {
          // 서버가 돌려준 실제 원인 메시지를 최대한 표면화한다.
          let detail = `서버 응답 ${res.status}`;
          try {
            const body = await res.json();
            if (body?.error) detail = body.error;
          } catch {
            /* JSON 아니면 무시 */
          }
          throw new Error(detail);
        }
        const { fileKey, fileUrl } = await res.json();

        await uploadMutation.mutateAsync({
          subject,
          fileName: file.name,
          fileKey,
          fileUrl,
          fileSize: file.size,
        });

        await utils.materials.list.invalidate();
        toast.success(`"${file.name}" 업로드 완료`, { id: toastId });
        onUploaded?.();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          toast.info("업로드를 취소했습니다.", { id: toastId });
        } else {
          console.error("Upload error:", err);
          toast.error(
            err instanceof Error ? `업로드 실패: ${err.message}` : "업로드에 실패했습니다.",
            { id: toastId },
          );
        }
      } finally {
        abortRef.current = null;
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [subject, uploading, uploadMutation, utils, onUploaded],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void uploadFile(file);
    },
    [uploadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void uploadFile(file);
    },
    [uploadFile],
  );

  const cancel = () => abortRef.current?.abort();

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept="application/pdf,.pdf"
      onChange={handleChange}
      disabled={uploading}
      className="hidden"
    />
  );

  // 컴팩트 버튼 모드
  if (mode === "button") {
    return (
      <>
        {hiddenInput}
        {uploading ? (
          <Button type="button" variant="outline" className={className} onClick={cancel}>
            <X className="w-4 h-4 mr-2" />
            취소
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            variant={variant}
            className={className}
          >
            <Upload className="w-4 h-4 mr-2" />
            PDF 업로드
          </Button>
        )}
      </>
    );
  }

  // 드래그앤드롭 영역 모드
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!uploading) setDragActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragActive(false);
      }}
      onDrop={handleDrop}
      className={cn(
        "rounded-lg border-2 border-dashed p-4 text-center transition-colors",
        dragActive ? "border-indigo-500 bg-indigo-50" : "border-muted-foreground/25",
        className,
      )}
    >
      {hiddenInput}
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <p className="text-sm text-muted-foreground">업로드 중...</p>
          <Button type="button" variant="outline" size="sm" onClick={cancel}>
            <X className="w-4 h-4 mr-1" />
            취소
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-5 h-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            PDF를 여기로 끌어다 놓거나
          </p>
          <Button
            type="button"
            size="sm"
            variant={variant}
            onClick={() => inputRef.current?.click()}
          >
            파일 선택
          </Button>
        </div>
      )}
    </div>
  );
}
