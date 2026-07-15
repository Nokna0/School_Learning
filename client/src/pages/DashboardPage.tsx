import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  BookMarked,
  CircleUser,
  Clock,
  GraduationCap,
  Target,
  TrendingUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SubjectGrid from "@/components/SubjectGrid";
import { SUBJECTS } from "@/lib/subjects";

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-4 px-5 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const statsQuery = trpc.studyRecords.getStats.useQuery();
  const stats = statsQuery.data;

  const onLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ===== 상단바 (학습 페이지와 동일한 스타일) ===== */}
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
          🎓 EduTech
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user?.name}님
          </span>
          <Link href="/account">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="계정">
              <CircleUser className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={onLogout}>
            로그아웃
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-12 px-4 py-10">
        {/* Hero / 학습 시작 — 학습 페이지와 같은 플랫·테두리·인디고 톤 */}
        <section className="flex flex-col gap-6 rounded-xl border bg-card p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 sm:flex">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                오늘의 학습
              </p>
              <h1 className="mb-1 text-2xl font-bold text-foreground md:text-3xl">
                다시 오신 걸 환영해요, {user?.name}님 👋
              </h1>
              <p className="text-muted-foreground">
                과목을 골라 바로 시작하세요.
              </p>
            </div>
          </div>
          <Link href="/subjects">
            <Button
              size="lg"
              className="bg-indigo-600 px-8 text-lg text-white hover:bg-indigo-700"
            >
              학습 시작하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </section>

        {/* 학습 통계 */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">학습 통계</h2>
            <Link href="/records">
              <Button variant="ghost" size="sm">
                <BookMarked className="mr-2 h-4 w-4" />
                기록 전체 보기
              </Button>
            </Link>
          </div>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={<Clock className="h-6 w-6" />}
              label="총 학습 시간"
              value={`${stats?.totalMinutes ?? 0}분`}
            />
            <StatCard
              icon={<Target className="h-6 w-6" />}
              label="학습 기록 수"
              value={`${stats?.totalRecords ?? 0}회`}
            />
            <StatCard
              icon={<TrendingUp className="h-6 w-6" />}
              label="평균 점수"
              value={
                stats && stats.totalRecords > 0
                  ? `${stats.averageScore.toFixed(0)}점`
                  : "-"
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(stats?.bySubject ?? []).map((s) => {
              const emoji = SUBJECTS.find((x) => x.key === s.subject)?.emoji;
              return (
                <Card key={s.subject}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {emoji && <span>{emoji}</span>}
                      {s.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>
                      학습 {s.records}회 · {s.minutes}분
                    </p>
                    <p>
                      평균 점수{" "}
                      {s.records > 0 ? `${s.averageScore.toFixed(0)}점` : "-"}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 과목 빠른 접근 */}
        <section>
          <h2 className="mb-6 text-xl font-bold text-foreground">과목 바로가기</h2>
          <SubjectGrid />
        </section>
      </div>
    </div>
  );
}
