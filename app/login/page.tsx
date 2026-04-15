'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Lock, 
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  LogIn
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { authSync } from '@/lib/auth/auth-sync';
import { storeToken } from '@/lib/auth/storage';
import { UserRole } from '@/lib/auth/storage-keys';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // 마운트 시 저장된 이메일 복원. auth state는 여기서 건드리지 않는다
  // (로그인 직후 저장된 토큰이 삭제될 수 있음)
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Start login process to prevent auth-sync race conditions
    authSync.startLogin();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include' // Enable cookie storage for middleware auth
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '로그인에 실패했습니다.');
      }

      // 역할별 이중 저장소(dual storage)에 새 토큰 저장
      if (data.token) {
        const userRole = data.user.role as UserRole;
        storeToken(userRole, data.token);
      }

      // Zustand persistent storage만 정리 (토큰은 방금 저장했으므로 보존)
      localStorage.removeItem('kyokwon119-storage');

      await new Promise(resolve => setTimeout(resolve, 100));

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      setUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        school: data.user.school,
        position: data.user.position,
        role: data.user.role,
        isAdmin: data.user.isAdmin,
        isVerified: data.user.isVerified,
      });

      // authSync.syncUserState를 호출하면 null 체크로 인해 auth state가 초기화됨
      // endLogin만 호출해서 refresh 보호만 활성화한다
      authSync.endLogin();

      toast.success(`환영합니다, ${data.user.name}님!`);

      // 역할별 독립 페이지로 리다이렉트
      let redirectUrl: string;
      switch (data.user.role) {
        case 'admin':
          redirectUrl = '/admin';
          break;
        case 'lawyer':
          redirectUrl = '/lawyer';
          break;
        case 'teacher':
          redirectUrl = '/teacher';
          break;
        default:
          redirectUrl = '/';
      }

      sessionStorage.removeItem('redirectAfterLogin');
      router.replace(redirectUrl);
      
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      // End login process to allow auth-sync operations to resume
      authSync.endLogin();
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-protection-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">교권119</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            교사의 권익을 보호합니다
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              로그인
            </CardTitle>
            <CardDescription>
              교권119 서비스를 이용하시려면 로그인해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  이메일
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@school.ac.kr"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    비밀번호
                  </Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    비밀번호 찾기
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  이메일 저장
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  '로그인 중...'
                ) : (
                  <>
                    로그인
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {/* OAuth Login (Future) */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-950 px-2 text-muted-foreground">
                    또는
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  className="text-xs"
                >
                  구글 로그인
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  className="text-xs"
                >
                  네이버 로그인
                </Button>
              </div>

              <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  보안을 위해 공용 컴퓨터에서는 사용 후 반드시 로그아웃해주세요.
                </AlertDescription>
              </Alert>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {/* Test Accounts Section */}
            <div className="w-full p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-medium text-sm text-yellow-800 dark:text-yellow-200 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                테스트 계정 (개발용)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                    <div className="font-medium text-green-700 dark:text-green-400">교사</div>
                    <div className="text-gray-600 dark:text-gray-300">teacher@kk119.com</div>
                    <div className="text-gray-500">Teacher2025!</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                    <div className="font-medium text-blue-700 dark:text-blue-400">변호사</div>
                    <div className="text-gray-600 dark:text-gray-300">lawyer@kk119.com</div>
                    <div className="text-gray-500">Lawyer2025!</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                    <div className="font-medium text-red-700 dark:text-red-400">슈퍼관리자</div>
                    <div className="text-gray-600 dark:text-gray-300">super@kk119.com</div>
                    <div className="text-gray-500">Super2025!</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-sm text-center text-gray-600 dark:text-gray-400">
              아직 계정이 없으신가요?{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                회원가입
              </Link>
            </div>
            <div className="text-xs text-center text-gray-500">
              <Link href="/privacy" className="hover:underline">
                개인정보처리방침
              </Link>
              {' · '}
              <Link href="/terms" className="hover:underline">
                이용약관
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}