import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useMaterialUpload } from "@/hooks/useMaterialUpload";
import type { SubjectKey } from "@/lib/subjects";

/**
 * PDF 업로드. 파일 선택/드래그앤드롭 → Cloudinary 업로드(/api/upload) → DB 저장(materials.upload)
 * → materials.list 캐시 무효화까지 한 번에 처리한다. 업로드 로직은 useMaterialUpload 훅에서 온다.
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
  subject: SubjectKey;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
  mode?: "button" | "dropzone";
  onUploaded?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const { uploadFile, uploading, cancel } = useMaterialUpload(subject, onUploaded);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void uploadFile(file);
      if (inputRef.current) inputRef.current.value = "";
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
