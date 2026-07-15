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
  Clock,
  Settings,
  Target,
  TrendingUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SubjectGrid from "@/components/SubjectGrid";

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
    <Card className="border-0 shadow-md">
      <CardContent className="pt-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">🎓 EduTech</div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user?.name}님
            </span>
            <Link href="/account">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={onLogout}>
              로그아웃
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 space-y-12">
        {/* Hero / 학습 시작 */}
        <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              다시 오신 걸 환영해요, {user?.name}님 👋
            </h1>
            <p className="text-indigo-100">
              오늘도 학습을 이어가 볼까요? 과목을 골라 바로 시작하세요.
            </p>
          </div>
          <Link href="/subjects">
            <Button
              size="lg"
              className="bg-white text-indigo-700 hover:bg-indigo-50 text-lg px-8"
            >
              학습 시작하기
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </section>

        {/* 학습 통계 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">학습 통계</h2>
            <Link href="/records">
              <Button variant="ghost" size="sm">
                <BookMarked className="w-4 h-4 mr-2" />
                기록 전체 보기
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard
              icon={<Clock className="w-6 h-6" />}
              label="총 학습 시간"
              value={`${stats?.totalMinutes ?? 0}분`}
            />
            <StatCard
              icon={<Target className="w-6 h-6" />}
              label="학습 기록 수"
              value={`${stats?.totalRecords ?? 0}회`}
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="평균 점수"
              value={
                stats && stats.totalRecords > 0
                  ? `${stats.averageScore.toFixed(0)}점`
                  : "-"
              }
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(stats?.bySubject ?? []).map((s) => (
              <Card key={s.subject} className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{s.label}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p>학습 {s.records}회 · {s.minutes}분</p>
                  <p>
                    평균 점수{" "}
                    {s.records > 0 ? `${s.averageScore.toFixed(0)}점` : "-"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 과목 빠른 접근 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">과목 바로가기</h2>
          <SubjectGrid />
        </section>
      </div>
    </div>
  );
}
