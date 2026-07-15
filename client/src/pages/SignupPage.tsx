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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("가입되었습니다. 환영합니다!");
      setLocation("/");
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }
    registerMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-10">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center">
          <Link href="/">
            <div className="text-2xl font-bold text-indigo-600 mb-2 cursor-pointer">
              🎓 EduTech
            </div>
          </Link>
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>아이디와 비밀번호만으로 시작하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>데모용 안내</AlertTitle>
            <AlertDescription>
              이 데모는 비밀번호를 <b>암호화 없이 평문으로 저장·비교</b>합니다.
              실제로 쓰는 비밀번호를 입력하지 마세요.
            </AlertDescription>
          </Alert>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="영문/숫자, 3자 이상"
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
                autoComplete="new-password"
                placeholder="4자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">비밀번호 확인</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              가입하기
            </Button>
          </form>

          <p className="text-sm text-gray-600 text-center mt-6">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-indigo-600 hover:underline">
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
