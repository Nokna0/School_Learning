import { useCallback, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// 수동 지정(role)이 없을 때만 참고하는 파일명 기반 기본 추정 규칙.
export const ANSWER_FILE_PATTERN = /답지|정답|해설|풀이|dapzi|answer|solution/i;

export type MaterialRole = "question" | "answer";

interface MaterialLike {
  id: string;
  fileName: string;
  role?: MaterialRole | null;
}

/**
 * 문제/답지 전환 로직 공용 훅(세 과목 공통).
 * - 각 자료의 역할(문제/답지)을 **수동 지정**할 수 있고, 지정이 없으면 파일명으로 추정한다.
 * - 지정은 DB(materials.role)에 저장되어 **기기 간 공유**된다.
 * - mode(문제/답지)에 따라 보이는 목록(visibleMaterials)을 필터링한다.
 */
export function useAnswerSheet<T extends MaterialLike>({
  materials,
  selected,
  setSelected,
  setPage,
}: {
  materials: T[];
  selected: T | null;
  setSelected: (m: T) => void;
  setPage: (p: number) => void;
}) {
  const [mode, setModeState] = useState<MaterialRole>("question");
  const utils = trpc.useUtils();

  const setRoleMutation = trpc.materials.setRole.useMutation({
    onSuccess: () => utils.materials.list.invalidate(),
    onError: (e) => toast.error(`역할 변경 실패: ${e.message}`),
  });

  const roleOf = useCallback(
    (m: T): MaterialRole =>
      m.role ?? (ANSWER_FILE_PATTERN.test(m.fileName) ? "answer" : "question"),
    [],
  );

  const questionMaterials = useMemo(
    () => materials.filter((m) => roleOf(m) === "question"),
    [materials, roleOf],
  );
  const answerMaterials = useMemo(
    () => materials.filter((m) => roleOf(m) === "answer"),
    [materials, roleOf],
  );
  const visibleMaterials = mode === "answer" ? answerMaterials : questionMaterials;

  // 자료의 역할을 수동 지정(DB 저장 → 목록 갱신).
  const designate = useCallback(
    (m: T, role: MaterialRole) => setRoleMutation.mutate({ id: m.id, role }),
    [setRoleMutation],
  );

  const setMode = useCallback(
    (next: MaterialRole) => {
      setModeState(next);
      // 전환한 모드의 첫 파일을 자동 선택(현재 선택이 그 모드에 없을 때).
      const list = next === "answer" ? answerMaterials : questionMaterials;
      if (list.length && (!selected || !list.some((m) => m.id === selected.id))) {
        setSelected(list[0]);
        setPage(1);
      }
    },
    [answerMaterials, questionMaterials, selected, setSelected, setPage],
  );

  const handleSelect = useCallback(
    (m: T) => {
      setSelected(m);
      setPage(1);
    },
    [setSelected, setPage],
  );

  return {
    mode,
    setMode,
    isAnswerMode: mode === "answer",
    visibleMaterials,
    questionMaterials,
    answerMaterials,
    answerAvailable: answerMaterials.length > 0,
    roleOf,
    designate,
    handleSelect,
  };
}
