'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Database,
  Upload,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  FileText,
  MessageSquare,
  Users,
  ArrowRight,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { migrationService, MigrationResult } from '@/lib/services/migration';
import { localDB } from '@/lib/services/localDB';
import toast from 'react-hot-toast';

interface MigrationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'completed' | 'error';
}

const initialSteps: MigrationStep[] = [
  {
    id: 'check',
    title: '데이터 확인',
    description: '로컬 데이터를 검사하고 마이그레이션 준비 상태를 확인합니다',
    icon: <Info className="h-4 w-4" />,
    status: 'pending'
  },
  {
    id: 'backup',
    title: '백업 생성',
    description: '기존 데이터를 안전하게 백업합니다',
    icon: <Database className="h-4 w-4" />,
    status: 'pending'
  },
  {
    id: 'migrate',
    title: '데이터 이전',
    description: 'Supabase로 데이터를 이전합니다',
    icon: <Upload className="h-4 w-4" />,
    status: 'pending'
  },
  {
    id: 'verify',
    title: '완료 확인',
    description: '마이그레이션 결과를 확인하고 정리합니다',
    icon: <CheckCircle className="h-4 w-4" />,
    status: 'pending'
  }
];

export default function MigrationWizard() {
  const { profile, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [steps, setSteps] = useState<MigrationStep[]>(initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [localDataCount, setLocalDataCount] = useState({ reports: 0, posts: 0, comments: 0 });
  const [canMigrate, setCanMigrate] = useState(false);
  const [migrationReason, setMigrationReason] = useState<string>('');

  // 로컬 데이터 확인
  useEffect(() => {
    const checkLocalData = () => {
      const reports = localDB.getAllReports().length;
      const posts = localDB.getAllPosts().length;
      const comments = localDB.getAllComments().length;

      setLocalDataCount({ reports, posts, comments });
    };

    checkLocalData();
  }, []);

  // 마이그레이션 준비 상태 확인
  const checkMigrationReadiness = async () => {
    if (!user) return;

    try {
      const result = await migrationService.checkMigrationReadiness(user.id);
      setCanMigrate(result.canMigrate);
      setMigrationReason(result.reason || '');
      setLocalDataCount(result.localDataCount);
    } catch (error) {
      console.error('Migration readiness check failed:', error);
      setCanMigrate(false);
      setMigrationReason('마이그레이션 준비 상태 확인에 실패했습니다.');
    }
  };

  // 다음 단계로 진행
  const nextStep = () => {
    setSteps(prev => prev.map((step, index) => {
      if (index === currentStepIndex) {
        return { ...step, status: 'completed' };
      } else if (index === currentStepIndex + 1) {
        return { ...step, status: 'active' };
      }
      return step;
    }));
    setCurrentStepIndex(prev => prev + 1);
  };

  // 단계 오류 처리
  const markStepError = (message: string) => {
    setSteps(prev => prev.map((step, index) =>
      index === currentStepIndex
        ? { ...step, status: 'error' }
        : step
    ));
    toast.error(message);
  };

  // 마이그레이션 실행
  const executeMigration = async () => {
    if (!user || !profile) {
      markStepError('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    setIsProcessing(true);

    try {
      // 단계 1: 데이터 확인
      setSteps(prev => prev.map((step, index) =>
        index === 0 ? { ...step, status: 'active' } : step
      ));
      setCurrentStepIndex(0);

      await checkMigrationReadiness();

      if (!canMigrate) {
        markStepError(migrationReason);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // UI 피드백을 위한 지연
      nextStep();

      // 단계 2: 백업 생성
      await new Promise(resolve => setTimeout(resolve, 500));
      nextStep();

      // 단계 3: 데이터 이전
      const associationId = await migrationService.checkMigrationReadiness(user.id)
        .then(result => result.localDataCount.reports > 0 ? undefined : undefined); // 기본 협회 ID 로직 필요

      const result = await migrationService.migrateAllData(user.id, associationId);
      setMigrationResult(result);

      if (!result.success) {
        markStepError(result.message);
        return;
      }

      nextStep();

      // 단계 4: 완료 확인
      await new Promise(resolve => setTimeout(resolve, 500));
      nextStep();

      toast.success('데이터 마이그레이션이 완료되었습니다!');
    } catch (error) {
      console.error('Migration failed:', error);
      markStepError('마이그레이션 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 초기화
  const resetWizard = () => {
    setSteps(initialSteps);
    setCurrentStepIndex(0);
    setIsProcessing(false);
    setMigrationResult(null);
    checkMigrationReadiness();
  };

  // 로컬 데이터가 없으면 마이그레이션 불필요
  const hasLocalData = localDataCount.reports > 0 || localDataCount.posts > 0 || localDataCount.comments > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full"
          onClick={checkMigrationReadiness}
        >
          <Database className="h-4 w-4 mr-2" />
          데이터 마이그레이션
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            localStorage → Supabase 데이터 마이그레이션
          </DialogTitle>
          <DialogDescription>
            기존 로컬 저장소의 데이터를 Supabase 클라우드 데이터베이스로 안전하게 이전합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 로컬 데이터 현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">현재 로컬 데이터 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-semibold text-xl">{localDataCount.reports}</div>
                  <div className="text-sm text-muted-foreground">신고</div>
                </div>
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="font-semibold text-xl">{localDataCount.posts}</div>
                  <div className="text-sm text-muted-foreground">게시글</div>
                </div>
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="font-semibold text-xl">{localDataCount.comments}</div>
                  <div className="text-sm text-muted-foreground">댓글</div>
                </div>
              </div>

              {!hasLocalData && (
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    마이그레이션할 로컬 데이터가 없습니다. 이미 Supabase를 사용하고 있거나 새로운 사용자입니다.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* 마이그레이션 준비 상태 */}
          {hasLocalData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">마이그레이션 준비 상태</CardTitle>
              </CardHeader>
              <CardContent>
                {canMigrate ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      마이그레이션을 진행할 수 있습니다. 모든 준비가 완료되었습니다.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {migrationReason || '마이그레이션을 진행할 수 없습니다.'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* 마이그레이션 단계 */}
          {hasLocalData && canMigrate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">마이그레이션 진행 상황</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      step.status === 'completed' ? 'bg-green-100 border-green-500 text-green-700' :
                      step.status === 'active' ? 'bg-blue-100 border-blue-500 text-blue-700' :
                      step.status === 'error' ? 'bg-red-100 border-red-500 text-red-700' :
                      'bg-gray-100 border-gray-300 text-gray-500'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : step.status === 'active' && isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : step.status === 'error' ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{step.title}</div>
                      <div className="text-sm text-muted-foreground">{step.description}</div>
                    </div>
                    <div>
                      <Badge variant={
                        step.status === 'completed' ? 'default' :
                        step.status === 'active' ? 'secondary' :
                        step.status === 'error' ? 'destructive' :
                        'outline'
                      }>
                        {step.status === 'completed' ? '완료' :
                         step.status === 'active' ? '진행중' :
                         step.status === 'error' ? '오류' :
                         '대기'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 마이그레이션 결과 */}
          {migrationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {migrationResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  마이그레이션 결과
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant={migrationResult.success ? 'default' : 'destructive'}>
                  <AlertDescription>{migrationResult.message}</AlertDescription>
                </Alert>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>신고 마이그레이션:</span>
                    <span>{migrationResult.details.reports.migrated}개 성공, {migrationResult.details.reports.errors}개 오류</span>
                  </div>
                  <div className="flex justify-between">
                    <span>게시글 마이그레이션:</span>
                    <span>{migrationResult.details.posts.migrated}개 성공, {migrationResult.details.posts.errors}개 오류</span>
                  </div>
                  <div className="flex justify-between">
                    <span>댓글 마이그레이션:</span>
                    <span>{migrationResult.details.comments.migrated}개 성공, {migrationResult.details.comments.errors}개 오류</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            닫기
          </Button>

          <div className="flex gap-2">
            {hasLocalData && canMigrate && !migrationResult && (
              <Button
                onClick={executeMigration}
                disabled={isProcessing}
                className="min-w-24"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    진행중...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    시작하기
                  </>
                )}
              </Button>
            )}

            {migrationResult && (
              <Button onClick={resetWizard} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                다시 시도
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}