'use client';

import { useStore } from '@/lib/store';
import {
  Shield,
  Eye,
  EyeOff,
  Mail,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { authSync } from '@/lib/auth/auth-sync';
import { storeToken } from '@/lib/auth/storage';
import { UserRole } from '@/lib/auth/storage-keys';

export default function HomePage() {
  const { user, setUser } = useStore();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [authInitialized, setAuthInitialized] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Wait for auth-sync to complete initialization before allowing redirects
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthInitialized(true);
      console.log('✅ [MAIN PAGE] Auth initialization grace period completed');
    }, 1500); // Wait 1.5 seconds for auth-sync to validate token

    return () => clearTimeout(timer);
  }, []);

  // Redirect logged-in users to their respective role-specific pages
  // Only redirect AFTER auth initialization is complete
  useEffect(() => {
    if (!authInitialized) {
      console.log('⏳ [MAIN PAGE] Waiting for auth initialization...');
      return;
    }

    const token = localStorage.getItem('token');

    if (user && user.role && token) {
      console.log('👤 [MAIN PAGE] User detected with valid token, redirecting to role-specific page:', user.role);
      setIsRedirecting(true);

      let targetPath = '/';
      switch (user.role) {
        case 'super_admin':
          targetPath = '/super-admin';
          break;
        case 'lawyer':
          targetPath = '/lawyer';
          break;
        case 'teacher':
          targetPath = '/teacher';
          break;
        default:
          setIsRedirecting(false);
          return;
      }

      router.replace(targetPath);
    } else if (user && !token) {
      // User data exists but no token - clear stale user data
      console.log('⚠️ [MAIN PAGE] User data exists without token, clearing stale data');
      setUser(null);
      setIsRedirecting(false);
    } else {
      console.log('👋 [MAIN PAGE] No valid session, showing login page');
      setIsRedirecting(false);
    }
  }, [user, router, setUser, authInitialized]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

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

    authSync.startLogin();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '로그인에 실패했습니다.');
      }

      if (data.token) {
        const userRole = data.user.role as UserRole;
        storeToken(userRole, data.token);
      }

      localStorage.removeItem('kyokwon119-storage');
      await new Promise(resolve => setTimeout(resolve, 100));

      const newUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        school: data.user.school,
        position: data.user.position,
        role: data.user.role,
        isAdmin: data.user.isAdmin,
        isVerified: data.user.isVerified
      };

      setUser(newUser);
      authSync.endLogin();

      toast.success(`환영합니다, ${data.user.name}님!`);

      let redirectUrl;
      switch (data.user.role) {
        case 'super_admin':
          redirectUrl = '/super-admin';
          break;
        case 'lawyer':
          redirectUrl = '/lawyer';
          break;
        case 'teacher':
          redirectUrl = '/teacher';
          break;
        default:
          redirectUrl = '/';
          break;
      }

      router.replace(redirectUrl);

    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      authSync.endLogin();
      setIsLoading(false);
    }
  };

  // Show loading screen while auth is initializing or redirecting
  if (!authInitialized || isRedirecting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!authInitialized ? '인증 확인 중...' : '로딩 중...'}
          </p>
        </div>
      </div>
    );
  }

  // Main landing page with login form for non-logged in users
  if (!user) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Orange Background with Quote */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 p-12 flex-col justify-between">
          <div>
            <Link href="/" className="flex items-center space-x-2 text-white">
              <Shield className="h-8 w-8" />
              <span className="text-2xl font-bold">교권119</span>
            </Link>
          </div>

          <div className="text-white">
            <div className="text-4xl mb-8">"</div>
            <p className="text-2xl leading-relaxed mb-8">
              교권119는 교사의 권리를 보호하고 교권 침해로부터 안전한 교육 환경을 만들기 위해 노력합니다. 전문 변호사와 함께 신속하고 체계적인 법률 상담을 받으세요.
            </p>
            <div>
              <p className="font-semibold">교권119 운영위원회</p>
              <p className="text-sm opacity-90">교사의 권리, 우리가 지킵니다</p>
            </div>
          </div>
        </div>

        {/* Right Side - White Background with Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">로그인</h1>
              <p className="text-gray-600">
                이메일로 교권119 시스템에 로그인하세요
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  이메일
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="teacher@school.ac.kr"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="pl-10"
                    autoComplete="email"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-6 text-base"
                disabled={isLoading}
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">또는</span>
                </div>
              </div>

              {/* Signup Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-orange-500 text-orange-500 hover:bg-orange-50 font-medium py-6 text-base"
                onClick={() => router.push('/signup')}
                disabled={isLoading}
              >
                회원가입
              </Button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-gray-600 hover:text-orange-500 transition-colors"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>

              {/* Footer Links */}
              <div className="text-center text-xs text-gray-500 pt-4">
                로그인함으로써 교권119의{' '}
                <Link href="/terms" className="text-orange-500 hover:underline">
                  이용약관
                </Link>
                {' '}및{' '}
                <Link href="/privacy" className="text-orange-500 hover:underline">
                  개인정보처리방침
                </Link>
                에 동의합니다.
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
