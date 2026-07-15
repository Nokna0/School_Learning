import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { SUBJECTS } from "@/lib/subjects";

export default function StudyRecordsPage() {
  const [, setLocation] = useLocation();

  const mathFormulasQuery = trpc.studyRecords.getMathFormulas.useQuery();
  const englishWordsQuery = trpc.studyRecords.getEnglishWords.useQuery();
  const statsQuery = trpc.studyRecords.getStats.useQuery();
  const recommendationsQuery = trpc.studyRecords.getRecommendations.useQuery();

  const deleteMathMutation = trpc.studyRecords.deleteMathFormula.useMutation({
    onSuccess: () => {
      mathFormulasQuery.refetch();
    },
  });

  const deleteEnglishMutation = trpc.studyRecords.deleteEnglishWord.useMutation(
    {
      onSuccess: () => {
        englishWordsQuery.refetch();
      },
    },
  );

  // 로컬 환경에서는 로그인 체크 불필요

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ===== 상단바 (학습 페이지와 동일한 스타일) ===== */}
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>
        <div className="text-sm font-semibold text-muted-foreground">
          학습 기록
        </div>
        <div className="w-[92px]" aria-hidden />
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">학습 기록</h1>
          <p className="text-muted-foreground">
            분석한 수학 공식과 영어 단어를 저장하고 관리하세요.
          </p>
        </div>

        <Tabs defaultValue="math" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3">
            <TabsTrigger value="math">수학 공식</TabsTrigger>
            <TabsTrigger value="english">영어 단어</TabsTrigger>
            <TabsTrigger value="stats">통계 & 추천</TabsTrigger>
          </TabsList>

          <TabsContent value="math">
            <div className="space-y-4">
              {mathFormulasQuery.isLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">로딩 중...</p>
                  </CardContent>
                </Card>
              ) : (mathFormulasQuery.data?.length ?? 0) === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="py-8 text-center text-muted-foreground">
                      저장된 수학 공식이 없습니다.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                mathFormulasQuery.data?.map((formula) => (
                  <Card key={formula.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded"
                              style={{
                                backgroundColor: formula.color || "#FF6B6B",
                              }}
                            />
                            <CardTitle className="font-mono text-lg">
                              {formula.expression}
                            </CardTitle>
                          </div>
                          {formula.type && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              유형: {formula.type}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            deleteMathMutation.mutate({ id: formula.id })
                          }
                          disabled={deleteMathMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    {formula.description && (
                      <CardContent>
                        <p className="text-foreground">{formula.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="english">
            <div className="space-y-4">
              {englishWordsQuery.isLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">로딩 중...</p>
                  </CardContent>
                </Card>
              ) : (englishWordsQuery.data?.length ?? 0) === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="py-8 text-center text-muted-foreground">
                      저장된 영어 단어가 없습니다.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                englishWordsQuery.data?.map((word) => (
                  <Card key={word.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{word.word}</CardTitle>
                          <div className="mt-2 space-y-1">
                            {word.meaning && (
                              <p className="text-sm text-foreground">
                                <span className="font-semibold">뜻:</span>{" "}
                                {word.meaning}
                              </p>
                            )}
                            {word.difficulty && (
                              <p className="text-sm text-muted-foreground">
                                <span className="font-semibold">난이도:</span>{" "}
                                <span
                                  className={`rounded px-2 py-1 text-xs font-medium ${
                                    word.difficulty === "easy"
                                      ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
                                      : word.difficulty === "medium"
                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300"
                                        : "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
                                  }`}
                                >
                                  {word.difficulty === "easy"
                                    ? "쉬움"
                                    : word.difficulty === "medium"
                                      ? "중간"
                                      : "어려움"}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            deleteEnglishMutation.mutate({ id: word.id })
                          }
                          disabled={deleteEnglishMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    {word.definition && (
                      <CardContent>
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">정의:</span>{" "}
                          {word.definition}
                        </p>
                      </CardContent>
                    )}
                    {word.example && (
                      <CardContent className="pt-0">
                        <p className="text-sm italic text-muted-foreground">
                          예: {word.example}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="space-y-6">
              {/* 학습 통계 */}
              <Card>
                <CardHeader>
                  <CardTitle>학습 통계</CardTitle>
                </CardHeader>
                <CardContent>
                  {statsQuery.isLoading ? (
                    <p className="text-muted-foreground">로딩 중...</p>
                  ) : statsQuery.data ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="rounded-lg bg-muted p-4">
                          <div className="text-3xl font-bold text-foreground">
                            {statsQuery.data.totalRecords}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            학습 기록
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted p-4">
                          <div className="text-3xl font-bold text-foreground">
                            {statsQuery.data.totalMinutes}분
                          </div>
                          <div className="text-sm text-muted-foreground">
                            총 학습 시간
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted p-4">
                          <div className="text-3xl font-bold text-foreground">
                            {statsQuery.data.averageScore.toFixed(1)}점
                          </div>
                          <div className="text-sm text-muted-foreground">
                            평균 점수
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {statsQuery.data.bySubject.map((s) => {
                          const emoji = SUBJECTS.find(
                            (x) => x.key === s.subject,
                          )?.emoji;
                          return (
                            <div
                              key={s.subject}
                              className="rounded-lg border p-4"
                            >
                              <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                                {emoji && <span>{emoji}</span>}
                                {s.label}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                학습 {s.records}회
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {s.minutes}분
                              </p>
                              <p className="text-sm text-muted-foreground">
                                평균 {s.averageScore.toFixed(1)}점
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      통계를 불러올 수 없습니다.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 맞춤형 학습 추천 */}
              <Card>
                <CardHeader>
                  <CardTitle>맞춤형 학습 추천</CardTitle>
                </CardHeader>
                <CardContent>
                  {recommendationsQuery.isLoading ? (
                    <p className="text-muted-foreground">로딩 중...</p>
                  ) : (
                    <div className="space-y-3">
                      {recommendationsQuery.data?.recommendations.map(
                        (rec, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10"
                          >
                            <div className="whitespace-nowrap font-semibold text-indigo-900 dark:text-indigo-200">
                              {rec.label}
                            </div>
                            <p className="text-sm text-indigo-800 dark:text-indigo-300">
                              {rec.reason}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
