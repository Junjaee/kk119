'use client';

import React from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * DashboardLayout — 로그인 후 공통 레이아웃.
 * SPEC-UI-001 M5. 토큰 기반으로 배경/간격 정리.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto scrollbar-modern bg-neutral-50/50 dark:bg-neutral-950/30">
          <div className="container-wide px-4 lg:px-8 py-6 lg:py-8">
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
