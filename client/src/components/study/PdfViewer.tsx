import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as pdfjsLib from "pdfjs-dist";
import "@/lib/pdf";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Minus, Plus, RotateCcw } from "lucide-react";

const DEFAULT_SCALE = 1.5;
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
// 클릭(선택 해제)과 드래그(영역 선택)를 가르는 임계값(px).
const CLICK_THRESHOLD = 4;

export interface PdfViewerHandle {
  /** 현재 드래그 선택 영역을 PNG base64로 크롭. 선택이 없으면 null. */
  cropSelection: () => string | null;
  /** 드래그 선택 영역 초기화. */
  clearSelection: () => void;
}

interface SelectionBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PdfViewerProps {
  fileUrl: string;
  page: number;
  onTotalPages?: (n: number) => void;
  /** 현재 페이지 텍스트 추출(영어/화학 분석용). */
  onText?: (text: string) => void;
  /** 드래그로 영역 선택 활성화(수학용). */
  enableSelection?: boolean;
  onSelectionChange?: (hasSelection: boolean) => void;
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(function PdfViewer(
  { fileUrl, page, onTotalPages, onText, enableSelection, onSelectionChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const loadedUrlRef = useRef<string | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void; promise: Promise<void> } | null>(
    null,
  );
  const hoveringRef = useRef(false);

  const [scale, setScale] = useState(DEFAULT_SCALE);

  // 드래그 선택 상태
  const [selection, setSelection] = useState<SelectionBox | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useImperativeHandle(ref, () => ({
    cropSelection: () => {
      const canvas = canvasRef.current;
      const wrapper = wrapperRef.current;
      if (!canvas || !wrapper || !selection || selection.width < CLICK_THRESHOLD) {
        return null;
      }
      // 래퍼는 캔버스를 꼭 감싸므로 좌표계가 동일하다.
      const scaleX = canvas.width / wrapper.clientWidth;
      const scaleY = canvas.height / wrapper.clientHeight;
      const sx = selection.left * scaleX;
      const sy = selection.top * scaleY;
      const sw = selection.width * scaleX;
      const sh = selection.height * scaleY;

      const temp = document.createElement("canvas");
      temp.width = Math.max(1, Math.round(sw));
      temp.height = Math.max(1, Math.round(sh));
      temp.getContext("2d")!.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
      return temp.toDataURL("image/png");
    },
    clearSelection: () => {
      setSelection(null);
      onSelectionChange?.(false);
    },
  }));

  /* ============ 렌더 ============ */
  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        // 문서는 URL이 바뀔 때만 새로 로드(줌/페이지 이동 시 재사용).
        if (loadedUrlRef.current !== fileUrl || !pdfDocRef.current) {
          const task = pdfjsLib.getDocument({
            url: apiUrl(`/api/pdf-proxy?u=${encodeURIComponent(fileUrl)}`),
            withCredentials: true,
          });
          const pdf = await task.promise;
          if (cancelled) return;
          pdfDocRef.current = pdf;
          loadedUrlRef.current = fileUrl;
          onTotalPages?.(pdf.numPages);
        }

        const pdf = pdfDocRef.current!;
        const pageNum = Math.min(Math.max(1, page), pdf.numPages);
        const pdfPage = await pdf.getPage(pageNum);
        if (cancelled) return;

        // 텍스트 추출(요청 시)
        if (onText) {
          const textContent = await pdfPage.getTextContent();
          const text = textContent.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ");
          if (!cancelled) onText(text);
        }

        const viewport = pdfPage.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            /* noop */
          }
        }

        const task = pdfPage.render({ canvas, canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;
      } catch (err) {
        const name = (err as { name?: string })?.name;
        if (name !== "RenderingCancelledException") {
          console.error("PDF render error:", err);
        }
      }
    };

    render();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, page, scale]);

  // 페이지/파일이 바뀌면 선택 해제
  useEffect(() => {
    setSelection(null);
    onSelectionChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, page]);

  /* ============ 줌: Ctrl+휠 / Ctrl +,- (마우스가 PDF 위일 때) ============ */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const clamp = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return; // Ctrl 없으면 일반 스크롤(팬)
      e.preventDefault();
      setScale((s) => clamp(s - Math.sign(e.deltaY) * 0.15));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!hoveringRef.current || !e.ctrlKey) return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setScale((s) => clamp(s + 0.2));
      } else if (e.key === "-") {
        e.preventDefault();
        setScale((s) => clamp(s - 0.2));
      } else if (e.key === "0") {
        e.preventDefault();
        setScale(DEFAULT_SCALE);
      }
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  /* ============ 드래그 선택(수학) ============ */
  const coordsInWrapper = (e: React.MouseEvent) => {
    const rect = wrapperRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enableSelection || !wrapperRef.current) return;
    // 새 드래그 시작 시 이전 선택 해제(클릭만 해도 지워짐)
    setSelection(null);
    onSelectionChange?.(false);
    dragStartRef.current = coordsInWrapper(e);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const { x, y } = coordsInWrapper(e);
    const start = dragStartRef.current;
    setSelection({
      left: Math.min(start.x, x),
      top: Math.min(start.y, y),
      width: Math.abs(x - start.x),
      height: Math.abs(y - start.y),
    });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;
    // 이동량이 작으면 클릭으로 간주해 선택 해제
    setSelection((box) => {
      if (box && (box.width < CLICK_THRESHOLD || box.height < CLICK_THRESHOLD)) {
        onSelectionChange?.(false);
        return null;
      }
      onSelectionChange?.(!!box);
      return box;
    });
  };

  return (
    <div className="relative h-full w-full">
      {/* 줌 컨트롤 (PDF 영역 상단 가운데). 가운데 버튼(휠클릭) → 기본값 */}
      <div
        className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background/90 px-2 py-1 shadow-sm backdrop-blur"
        onMouseDown={(e) => {
          // 가운데(휠) 버튼 클릭 시 기본 배율로
          if (e.button === 1) {
            e.preventDefault();
            setScale(DEFAULT_SCALE);
          }
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setScale((s) => Math.max(MIN_SCALE, s - 0.2))}
          title="축소"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <button
          className="min-w-[3rem] text-center text-sm font-medium tabular-nums"
          onClick={() => setScale(DEFAULT_SCALE)}
          title="기본 배율로"
        >
          {Math.round((scale / DEFAULT_SCALE) * 100)}%
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setScale((s) => Math.min(MAX_SCALE, s + 0.2))}
          title="확대"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setScale(DEFAULT_SCALE)}
          title="기본 배율로"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* 스크롤(팬) 컨테이너 */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-auto bg-muted p-4"
        onMouseEnter={() => (hoveringRef.current = true)}
        onMouseLeave={() => {
          hoveringRef.current = false;
          handleMouseUp();
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          ref={wrapperRef}
          className="relative mx-auto w-fit"
          style={{ cursor: enableSelection ? "crosshair" : "default" }}
        >
          <canvas ref={canvasRef} className="block shadow-lg" />
          {selection && (
            <div
              className="pointer-events-none absolute border-2 border-blue-600 bg-blue-400/25"
              style={{
                left: selection.left,
                top: selection.top,
                width: selection.width,
                height: selection.height,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
});

export default PdfViewer;
