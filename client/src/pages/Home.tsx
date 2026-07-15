import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "wouter";
import {
  BookOpen,
  Zap,
  Users,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

/** 스크롤에 따라 순차적으로 이야기가 펼쳐지는 랜딩 페이지.
 *  - 패럴랙스: 히어로의 배경/장식/텍스트 레이어가 서로 다른 속도로 움직인다.
 *  - 스크롤텔링: 각 섹션이 뷰포트에 들어올 때 아래에서 위로 순차 등장한다.
 *  꾸밈 요소는 이 첫 페이지에만 적용한다. */
export default function Home() {
  // 아직 별도 페이지/문서가 없는 항목. 클릭 시 안내만 표시한다.
  const notReady = () => toast("준비 중인 기능입니다.");

  // 패럴랙스 레이어 refs (스크롤 시 style.transform 을 직접 갱신 → 리렌더 없음)
  const backRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // ── 스크롤텔링: 뷰포트 진입 시 순차 등장 ──
    const revealEls = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]")
    );
    if (prefersReduced) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.18 }
      );
      revealEls.forEach((el) => io.observe(el));

      // ── 패럴랙스: 레이어별로 다른 속도 ──
      let raf = 0;
      const update = () => {
        raf = 0;
        const y = window.scrollY;
        if (backRef.current)
          backRef.current.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
        if (midRef.current)
          midRef.current.style.transform = `translate3d(0, ${y * 0.4}px, 0)`;
        if (frontRef.current)
          frontRef.current.style.transform = `translate3d(0, ${y * -0.06}px, 0)`;
      };
      const onScroll = () => {
        if (!raf) raf = requestAnimationFrame(update);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      update();

      return () => {
        io.disconnect();
        window.removeEventListener("scroll", onScroll);
        if (raf) cancelAnimationFrame(raf);
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">🎓 모우미</div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                로그인
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                회원가입
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ───────── HERO (패럴랙스) ───────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
        {/* 배경 레이어 — 가장 느리게 */}
        <div ref={backRef} className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-6rem] top-24 h-80 w-80 rounded-full bg-indigo-200/45 blur-3xl" />
          <div className="absolute bottom-4 right-[-4rem] h-96 w-96 rounded-full bg-slate-200/50 blur-3xl" />
          <div className="absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-indigo-100/60 blur-3xl" />
        </div>

        {/* 장식(과목 이모지) 레이어 — 중간 속도 + 은은한 부유 */}
        <div ref={midRef} className="pointer-events-none absolute inset-0">
          <span className="floaty absolute left-[12%] top-[26%] text-5xl opacity-80 select-none">
            📚
          </span>
          <span
            className="floaty absolute right-[14%] top-[20%] text-5xl opacity-80 select-none"
            style={{ animationDelay: "-1.8s" }}
          >
            📐
          </span>
          <span
            className="floaty absolute left-[20%] bottom-[18%] text-5xl opacity-80 select-none"
            style={{ animationDelay: "-3.4s" }}
          >
            ⚗️
          </span>
          <span
            className="floaty absolute right-[20%] bottom-[24%] text-4xl opacity-70 select-none"
            style={{ animationDelay: "-2.4s" }}
          >
            ✏️
          </span>
        </div>

        {/* 텍스트 레이어 — 살짝 위로 (전경) */}
        <div
          ref={frontRef}
          className="relative z-10 mx-auto max-w-3xl px-4 text-center"
        >
          <p
            data-reveal
            className="reveal mb-4 text-sm font-semibold tracking-wide text-indigo-600"
          >
            AI 기반 개인 맞춤형 학습
          </p>
          <h1
            data-reveal
            className="reveal reveal-delay-1 text-5xl font-bold leading-tight md:text-7xl"
          >
            모우미
            <br />
            <span className="text-indigo-600">스마트 학습 플랫폼</span>
          </h1>
          <p
            data-reveal
            className="reveal reveal-delay-2 mx-auto mt-6 max-w-xl text-lg text-gray-600"
          >
            교육 격차를 넘어, 모든 학생에게 동등한 배움의 기회를.
          </p>
          <div
            data-reveal
            className="reveal reveal-delay-3 mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/subjects">
              <Button
                size="lg"
                className="bg-indigo-600 px-8 py-6 text-lg hover:bg-indigo-700"
              >
                학습 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                회원가입하고 기록 남기기
              </Button>
            </Link>
          </div>
          <p data-reveal className="reveal reveal-delay-3 mt-5 text-sm text-gray-500">
            로그인 없이도 이용할 수 있어요. 단, 학습 현황은 저장되지 않습니다.
          </p>
        </div>

        {/* 스크롤 힌트 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-indigo-400">
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </div>
      </section>

      {/* ───────── STORY: 문제 제기 ───────── */}
      <section className="container mx-auto px-4 py-28 md:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <p
            data-reveal
            className="reveal text-sm font-semibold tracking-wide text-indigo-600"
          >
            WHY 모우미
          </p>
          <h2
            data-reveal
            className="reveal reveal-delay-1 mt-3 text-3xl font-bold leading-snug md:text-5xl"
          >
            어디에 살든,
            <br className="hidden sm:block" /> 좋은 공부는 누구에게나.
          </h2>
          <p
            data-reveal
            className="reveal reveal-delay-2 mt-6 text-lg leading-relaxed text-gray-600"
          >
            도시든 시골이든, 학원이 있든 없든. 교재 한 장만 있으면 AI가 선생님이
            되어 줍니다. 모우미는 배움의 출발선을 모두에게 똑같이 맞춥니다.
          </p>
        </div>
      </section>

      {/* ───────── STORY: 기능 3단계 (좌우 번갈아 등장) ───────── */}
      <section className="bg-gradient-to-b from-white to-indigo-50/40 py-24">
        <div className="container mx-auto px-4">
          <h2
            data-reveal
            className="reveal mb-16 text-center text-3xl font-bold md:text-4xl"
          >
            이렇게 공부해요
          </h2>

          <div className="mx-auto max-w-4xl space-y-16 md:space-y-24">
            <StoryFeature
              icon={<BookOpen className="h-7 w-7" />}
              step="01"
              title="스마트 교재 분석"
              body="PDF 교재를 올리면 AI가 자동으로 핵심 내용을 뽑아내고, 바로 학습할 수 있는 자료로 바꿔 줍니다."
            />
            <StoryFeature
              reverse
              icon={<Zap className="h-7 w-7" />}
              step="02"
              title="과목별 맞춤 학습"
              body="영어·수학·화학. 과목마다 특화된 도구로, 단어 하이라이트부터 함수 그래프 시각화까지 딱 맞게 배웁니다."
            />
            <StoryFeature
              icon={<Users className="h-7 w-7" />}
              step="03"
              title="백지 퀴즈로 복습"
              body="학습한 내용을 바탕으로 자동 생성된 퀴즈를 풀며, 내가 얼마나 이해했는지 스스로 확인하고 채워 나갑니다."
            />
          </div>
        </div>
      </section>

      {/* ───────── STORY: 과목 선택 ───────── */}
      <section className="container mx-auto px-4 py-28">
        <h2
          data-reveal
          className="reveal mb-4 text-center text-3xl font-bold md:text-4xl"
        >
          어떤 과목부터 시작할까요?
        </h2>
        <p
          data-reveal
          className="reveal reveal-delay-1 mb-12 text-center text-gray-600"
        >
          지금 바로 골라서 학습을 시작해 보세요.
        </p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <SubjectCard
            href="/english"
            emoji="📚"
            title="영어"
            description="어려운 단어 학습 및 독해 능력 향상"
            detail="AI가 감지한 어려운 단어를 하이라이트하고 한국어 뜻을 제공합니다."
            delay="reveal-delay-1"
          />
          <SubjectCard
            href="/math"
            emoji="📐"
            title="수학"
            description="함수식 시각화 및 동적 그래프 학습"
            detail="수학 함수를 동적 그래프로 시각화하고 계수를 변경하며 학습합니다."
            delay="reveal-delay-2"
          />
          <SubjectCard
            href="/chemistry"
            emoji="⚗️"
            title="화학"
            description="화학 개념 정리 및 퀴즈 학습"
            detail="화학 교재를 분석하여 백지 퀴즈로 학습 효과를 극대화합니다."
            delay="reveal-delay-3"
          />
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="container mx-auto px-4 pb-28">
        <div
          data-reveal
          className="reveal mx-auto max-w-4xl rounded-3xl bg-indigo-600 px-8 py-16 text-center text-white md:py-20"
        >
          <h2 className="text-3xl font-bold md:text-4xl">
            오늘의 공부, 지금 시작해요
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-indigo-100">
            로그인 없이도 바로 이용할 수 있어요. 기록을 남기고 싶다면 회원가입만
            하면 됩니다.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/subjects">
              <Button
                size="lg"
                className="bg-white px-8 text-lg text-indigo-700 hover:bg-indigo-50"
              >
                학습 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="lg"
                variant="outline"
                className="border-white/60 bg-transparent px-8 text-lg text-white hover:bg-white/10"
              >
                회원가입
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 text-gray-400">
        <div className="container mx-auto px-4">
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 font-bold text-white">모우미</h3>
              <p className="text-sm">시골 지역 학생들을 위한 스마트 학습 플랫폼</p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">학습</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/english" className="hover:text-white">
                    영어
                  </Link>
                </li>
                <li>
                  <Link href="/math" className="hover:text-white">
                    수학
                  </Link>
                </li>
                <li>
                  <Link href="/chemistry" className="hover:text-white">
                    화학
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">정보</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button type="button" onClick={notReady} className="hover:text-white">
                    소개
                  </button>
                </li>
                <li>
                  <button type="button" onClick={notReady} className="hover:text-white">
                    기능
                  </button>
                </li>
                <li>
                  <button type="button" onClick={notReady} className="hover:text-white">
                    연락처
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">법률</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button type="button" onClick={notReady} className="hover:text-white">
                    이용약관
                  </button>
                </li>
                <li>
                  <button type="button" onClick={notReady} className="hover:text-white">
                    개인정보
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 모우미. 모든 권리 보유.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** 기능 소개 한 단계 — 스크롤 시 아이콘/텍스트가 순차 등장하고 좌우로 번갈아 배치된다. */
function StoryFeature({
  icon,
  step,
  title,
  body,
  reverse = false,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  body: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-8 md:gap-14 ${
        reverse ? "md:flex-row-reverse" : "md:flex-row"
      }`}
    >
      {/* 아이콘/스텝 비주얼 */}
      <div
        data-reveal
        className="reveal flex h-40 w-40 shrink-0 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 shadow-sm"
      >
        <div className="text-center">
          <div className="flex justify-center">{icon}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-indigo-300">
            {step}
          </div>
        </div>
      </div>
      {/* 설명 텍스트 */}
      <div
        data-reveal
        className="reveal reveal-delay-1 flex-1 text-center md:text-left"
      >
        <p className="text-sm font-semibold text-indigo-500">STEP {step}</p>
        <h3 className="mt-2 text-2xl font-bold md:text-3xl">{title}</h3>
        <p className="mt-3 text-lg leading-relaxed text-gray-600">{body}</p>
      </div>
    </div>
  );
}

/** 과목 선택 카드 — 스크롤 등장 + 호버 시 살짝 떠오른다. */
function SubjectCard({
  href,
  emoji,
  title,
  description,
  detail,
  delay,
}: {
  href: string;
  emoji: string;
  title: string;
  description: string;
  detail: string;
  delay?: string;
}) {
  return (
    <Link href={href}>
      <div data-reveal className={`reveal ${delay ?? ""} h-full`}>
        <Card className="h-full cursor-pointer border-2 border-transparent transition-all hover:-translate-y-1 hover:border-indigo-400 hover:shadow-lg">
          <CardHeader>
            <div className="mb-4 text-5xl">{emoji}</div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">{detail}</p>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
              시작하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </Link>
  );
}
