import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import AccountPage from "@/pages/AccountPage";
import SubjectSelectPage from "@/pages/SubjectSelectPage";
import MathStudyPage from "@/pages/MathStudyPage";
import EnglishStudyPage from "@/pages/EnglishStudyPage";
import ScienceStudyPage from "@/pages/ScienceStudyPage";
import KoreanStudyPage from "@/pages/KoreanStudyPage";
import StudyRecordsPage from "@/pages/StudyRecordsPage";
import { Redirect, Route, Switch } from "wouter";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";

// 메인 경로("/"): 로그인 상태면 대시보드, 비로그인이면 홍보 페이지.
function HomeRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }
  return isAuthenticated ? <DashboardPage /> : <Home />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/account" component={AccountPage} />
      <Route path="/subjects" component={SubjectSelectPage} />
      <Route path="/math" component={MathStudyPage} />
      <Route path="/english" component={EnglishStudyPage} />
      <Route path="/science" component={ScienceStudyPage} />
      <Route path="/korean" component={KoreanStudyPage} />
      {/* 화학 → 탐구 경로 변경 호환 */}
      <Route path="/chemistry">{() => <Redirect to="/science" />}</Route>
      {/* 과거 /study/* 경로 호환 */}
      <Route path="/study/math" component={MathStudyPage} />
      <Route path="/study/english" component={EnglishStudyPage} />
      <Route path="/study/science" component={ScienceStudyPage} />
      <Route path="/study/korean" component={KoreanStudyPage} />
      <Route path="/study/chemistry">{() => <Redirect to="/science" />}</Route>
      <Route path="/records" component={StudyRecordsPage} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
