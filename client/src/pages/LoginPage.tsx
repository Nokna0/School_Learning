import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("로그인되었습니다.");
      setLocation("/");
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      username: username.trim(),
      password,
      token: token.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center">
          <Link href="/">
            <div className="text-2xl font-bold text-indigo-600 mb-2 cursor-pointer">
              🎓 EduTech
            </div>
          </Link>
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>계정별 학습 현황을 이어서 확인하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">2단계 인증 코드 (설정한 경우)</Label>
              <Input
                id="token"
                inputMode="numeric"
                placeholder="6자리 코드"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              로그인
            </Button>
          </form>

          <p className="text-sm text-gray-600 text-center mt-6">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="text-indigo-600 hover:underline">
              회원가입
            </Link>
          </p>
          <p className="text-sm text-gray-500 text-center mt-2">
            <Link href="/subjects" className="hover:underline">
              로그인 없이 둘러보기
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
