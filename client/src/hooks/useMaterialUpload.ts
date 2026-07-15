import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";
import { trpc } from "@/lib/trpc";
import type { SubjectKey } from "@/lib/subjects";

// 서버(multer, express.json)의 50MB 제한과 동일하게 맞춘다.
const MAX_SIZE = 50 * 1024 * 1024;

/**
 * PDF 업로드 로직 공용 훅.
 * 파일 검증(PDF·50MB) → Cloudinary 업로드(/api/upload) → DB 저장(materials.upload)
 * → materials.list 캐시 무효화까지 처리한다. 업로드 중 취소(AbortController) 지원.
 *
 * MaterialUploadButton(사이드바 드롭존/헤더 버튼)과 StudyShell(중앙 PDF 드롭)이 함께 쓴다.
 */
export function useMaterialUpload(subject: SubjectKey, onUploaded?: () => void) {
  const abortRef = useRef<AbortController | null>(null);
  const [uploading, setUploading] = useState(false);
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
      }
    },
    [subject, uploading, uploadMutation, utils, onUploaded],
  );

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  return { uploadFile, uploading, cancel };
}
