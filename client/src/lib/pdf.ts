// PDF.js 워커 설정 — import 시 1회 실행되는 사이드이펙트 모듈.
// 설치된 pdfjs-dist와 항상 버전이 일치하는 워커를 번들에 포함시킨다.
// (기존 CDN 방식은 pdfjs 5.x에서 .min.js 경로가 404라 렌더링이 깨졌음)
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
