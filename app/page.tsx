'use client';

import { useStore } from '@/lib/store';
import {
  Shield,
  ArrowRight,
  CheckCircle,
  Users,
  BookOpen,
  Phone,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user } = useStore();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleNavigation = (path: string) => {
    startTransition(() => {
      try {
        router.push(path);
      } catch (error) {
        console.error('Navigation error:', error);
      }
    });
  };

  // Redirect logged-in users to their respective role-specific pages
  // This only happens if they somehow end up on the main page while logged in
  useEffect(() => {
    if (user && user.role) {
      console.log('👤 [MAIN PAGE] User detected, redirecting to role-specific page:', user.role);
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

      // Use replace instead of push to prevent back button issues
      router.replace(targetPath);
    }
  }, [user, router]);

  // Show loading screen while redirecting users to their role-specific pages
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-protection-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Main landing page for non-logged in users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-protection-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* Navigation Bar */}
        <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">교권119</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleNavigation('/login')}
                disabled={isPending}
                className="px-3 py-2 text-sm border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? '로딩 중...' : '로그인'}
              </button>
              <button
                onClick={() => handleNavigation('/signup')}
                disabled={isPending}
                className="px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? '로딩 중...' : '회원가입'}
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-8">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-protection-600">
              교권119
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-3">
              교사의 권익을 보호합니다
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-500 max-w-2xl mx-auto mb-8">
              교권 침해로부터 안전하고 빠른 법률 상담을 받으세요.
              전문 변호사 네트워크와 함께합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleNavigation('/login')}
                disabled={isPending}
                className="px-6 py-3 text-lg font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? '로딩 중...' : '로그인'}
                {!isPending && <ArrowRight className="h-5 w-5" />}
              </button>
              <button
                onClick={() => handleNavigation('/signup')}
                disabled={isPending}
                className="px-6 py-3 text-lg font-medium border-2 border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? '로딩 중...' : '회원가입 시작하기'}
                {!isPending && <ArrowRight className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">빠른 상담</h3>
              <p className="text-gray-600 dark:text-gray-400">
                교권 침해 상황이 발생했을 때 즉시 전문 변호사로부터 상담을 받을 수 있습니다.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="p-3 bg-protection/10 rounded-lg w-fit mb-4">
                <Shield className="h-6 w-6 text-protection-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">법적 보호</h3>
              <p className="text-gray-600 dark:text-gray-400">
                법률 자문과 법적 절차에 대한 전문적인 조언으로 교권을 지킵니다.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="p-3 bg-trust/10 rounded-lg w-fit mb-4">
                <Users className="h-6 w-6 text-trust-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">공동체 지원</h3>
              <p className="text-gray-600 dark:text-gray-400">
                다른 교사들과 경험을 공유하고 함께 교권을 지키는 커뮤니티입니다.
              </p>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">제공 서비스</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Service 1 */}
            <div className="p-6 bg-gradient-to-br from-primary/5 to-transparent rounded-xl border border-primary/20">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary rounded-lg flex-shrink-0">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">신고 및 상담</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    교권 침해 상황을 신고하고 전문 변호사로부터 신속한 법률 상담을 받으세요.
                  </p>
                </div>
              </div>
            </div>

            {/* Service 2 */}
            <div className="p-6 bg-gradient-to-br from-protection/5 to-transparent rounded-xl border border-protection-200/50 dark:border-protection-800/50">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-protection-600 rounded-lg flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">교권 자료실</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    교권 보호에 관련된 법률 정보와 실용적인 자료를 제공합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Service 3 */}
            <div className="p-6 bg-gradient-to-br from-trust/5 to-transparent rounded-xl border border-trust-200/50 dark:border-trust-800/50">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-trust-600 rounded-lg flex-shrink-0">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">커뮤니티</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    다른 교사들과 경험과 정보를 공유하는 안전한 공간입니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Service 4 */}
            <div className="p-6 bg-gradient-to-br from-secondary/5 to-transparent rounded-xl border border-secondary-200/50 dark:border-secondary-800/50">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-secondary-600 rounded-lg flex-shrink-0">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">전문가 지원</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    경험 많은 변호사와 교권 전문가들의 전문적인 지원을 받으세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-primary/10 dark:bg-primary/5 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                <p className="text-gray-600 dark:text-gray-400">연중무휴 상담</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">1000+</div>
                <p className="text-gray-600 dark:text-gray-400">교사 커뮤니티</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <p className="text-gray-600 dark:text-gray-400">기밀 보장</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 py-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-primary rounded-lg">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-white">교권119</span>
                </div>
                <p className="text-sm">교사의 권익을 보호합니다</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">서비스</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button
                      onClick={() => handleNavigation('/login')}
                      disabled={isPending}
                      className="hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? '로딩 중...' : '로그인'}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigation('/signup')}
                      disabled={isPending}
                      className="hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? '로딩 중...' : '회원가입'}
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">정보</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/privacy" className="hover:text-white">개인정보처리방침</Link></li>
                  <li><Link href="/terms" className="hover:text-white">이용약관</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">문의</h4>
                <ul className="space-y-2 text-sm">
                  <li>Email: support@kk119.com</li>
                  <li>Phone: 1234-5678</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-sm">
              <p>&copy; 2025 교권119. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return null;
}
