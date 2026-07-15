import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SUBJECTS } from "@/lib/subjects";

/** 네 과목 선택 카드 그리드. 과목 선택 페이지·대시보드·홍보 페이지가 공유한다. */
export default function SubjectGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {SUBJECTS.map((s) => (
        <Link key={s.key} href={s.href}>
          <Card className="h-full cursor-pointer border-2 border-transparent transition-all hover:border-indigo-400 hover:shadow-lg">
            <CardHeader>
              <div className="mb-4 text-5xl">{s.emoji}</div>
              <CardTitle className="text-2xl">{s.label}</CardTitle>
              <CardDescription>{s.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">{s.detail}</p>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                시작하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
