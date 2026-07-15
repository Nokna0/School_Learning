import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import SubjectGrid from "@/components/SubjectGrid";

/** "학습 시작하기" 클릭 시 도착하는 과목 선택 페이지. */
export default function SubjectSelectPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="text-2xl font-bold text-indigo-600 cursor-pointer">
              🎓 EduTech
            </div>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
          </Link>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold text-gray-900">
            학습할 과목을 선택하세요
          </h1>
          <p className="text-lg text-gray-600">
            과목을 고르면 PDF를 올려 AI 학습을 시작할 수 있어요.
          </p>
        </div>
        <div className="max-w-5xl mx-auto">
          <SubjectGrid />
        </div>
      </section>
    </div>
  );
}
