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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AccountPage() {
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated, refresh } = useAuth();
  const utils = trpc.useUtils();

  const [setup, setSetup] = useState<{ secret: string; otpauthUri: string } | null>(
    null,
  );
  const [token, setToken] = useState("");

  const setupMutation = trpc.auth.setupTotp.useMutation({
    onSuccess: (data) => setSetup(data),
    onError: (err) => toast.error(err.message),
  });
  const enableMutation = trpc.auth.enableTotp.useMutation({
    onSuccess: async () => {
      toast.success("2단계 인증이 켜졌습니다.");
      setSetup(null);
      setToken("");
      await utils.auth.me.invalidate();
      refresh();
    },
    onError: (err) => toast.error(err.message),
  });
  const disableMutation = trpc.auth.disableTotp.useMutation({
    onSuccess: async () => {
      toast.success("2단계 인증을 껐습니다.");
      await utils.auth.me.invalidate();
      refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">로그인이 필요합니다.</p>
        <Link href="/login">
          <Button>로그인하러 가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          onClick={() => setLocation("/")}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Button>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">계정 설정</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              2단계 인증 (TOTP)
              {user?.totpEnabled ? (
                <Badge className="bg-green-600">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  켜짐
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <ShieldOff className="w-3 h-3 mr-1" />
                  꺼짐
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Google Authenticator, Authy 같은 인증 앱으로 로그인을 보호합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.totpEnabled ? (
              <Button
                variant="destructive"
                onClick={() => disableMutation.mutate()}
                disabled={disableMutation.isPending}
              >
                {disableMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                2단계 인증 끄기
              </Button>
            ) : setup ? (
              <div className="space-y-4">
                <div className="rounded-md bg-gray-100 p-4 text-sm">
                  <p className="mb-2 text-gray-600">
                    인증 앱에 아래 키를 수동으로 추가하세요:
                  </p>
                  <code className="block break-all font-mono text-indigo-700 text-base">
                    {setup.secret}
                  </code>
                  <p className="mt-3 text-xs text-gray-500 break-all">
                    또는 이 otpauth URI를 사용: {setup.otpauthUri}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">인증 앱에 표시된 6자리 코드</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    placeholder="000000"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => enableMutation.mutate({ token: token.trim() })}
                    disabled={enableMutation.isPending || token.trim().length < 6}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {enableMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    확인하고 켜기
                  </Button>
                  <Button variant="outline" onClick={() => setSetup(null)}>
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {setupMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                2단계 인증 설정 시작
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
