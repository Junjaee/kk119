'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Upload,
  Database,
  AlertTriangle,
  CheckCircle,
  Trash2,
  FileText,
  Server,
  HardDrive
} from 'lucide-react';
import { backupService, BackupData } from '@/lib/services/localStorageBackup';

export function BackupManager() {
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadMigrationStatus();
    loadBackupData();
  }, []);

  const loadMigrationStatus = () => {
    const status = backupService.getMigrationStatus();
    setMigrationStatus(status);
  };

  const loadBackupData = () => {
    const backup = backupService.getStoredBackup();
    setBackupData(backup);
  };

  const handleCreateBackup = async () => {
    setIsProcessing(true);
    setMessage(null);

    try {
      const backup = backupService.createFullBackup();
      setBackupData(backup);
      setMessage({ type: 'success', text: '백업이 성공적으로 생성되었습니다.' });
      loadMigrationStatus();
    } catch (error) {
      setMessage({ type: 'error', text: '백업 생성 중 오류가 발생했습니다.' });
      console.error('Backup creation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadBackup = () => {
    try {
      backupService.downloadBackupAsJSON();
      setMessage({ type: 'success', text: '백업 파일 다운로드가 시작되었습니다.' });
    } catch (error) {
      setMessage({ type: 'error', text: '백업 다운로드 중 오류가 발생했습니다.' });
      console.error('Download error:', error);
    }
  };

  const handleGenerateMigrationSQL = () => {
    setIsProcessing(true);
    setMessage(null);

    try {
      const sql = backupService.generateSupabaseMigrationSQL();
      const blob = new Blob([sql], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `supabase_migration_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage({ type: 'success', text: 'Supabase 마이그레이션 SQL 파일이 생성되었습니다.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'SQL 생성 중 오류가 발생했습니다.' });
      console.error('SQL generation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearBackup = () => {
    if (confirm('정말로 백업 데이터를 삭제하시겠습니까?')) {
      backupService.clearBackup();
      setBackupData(null);
      setMessage({ type: 'info', text: '백업 데이터가 삭제되었습니다.' });
      loadMigrationStatus();
    }
  };

  return (
    <div className="space-y-6">
      {/* 메시지 알림 */}
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : message.type === 'success' ? 'border-green-500' : 'border-blue-500'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* 마이그레이션 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            데이터 마이그레이션 상태
          </CardTitle>
          <CardDescription>
            LocalStorage에서 Supabase로의 데이터 마이그레이션 현황입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {migrationStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <HardDrive className="h-4 w-4" />
                    <span className="font-medium">로컬 데이터</span>
                  </div>
                  <Badge variant={migrationStatus.hasLocalData ? 'default' : 'secondary'}>
                    {migrationStatus.hasLocalData ? '데이터 있음' : '데이터 없음'}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">백업 파일</span>
                  </div>
                  <Badge variant={migrationStatus.hasBackup ? 'default' : 'secondary'}>
                    {migrationStatus.hasBackup ? '백업 완료' : '백업 없음'}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Server className="h-4 w-4" />
                    <span className="font-medium">Supabase</span>
                  </div>
                  <Badge variant="secondary">마이그레이션 대기</Badge>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">데이터 통계</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">신고:</span>
                    <span className="ml-2 font-medium">{migrationStatus.dataStats.reports}건</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">게시글:</span>
                    <span className="ml-2 font-medium">{migrationStatus.dataStats.posts}건</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">댓글:</span>
                    <span className="ml-2 font-medium">{migrationStatus.dataStats.comments}건</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              상태를 불러오는 중...
            </div>
          )}
        </CardContent>
      </Card>

      {/* 백업 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            LocalStorage 데이터 백업
          </CardTitle>
          <CardDescription>
            기존 데이터를 안전하게 백업하고 관리합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {backupData ? (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">백업 완료</span>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <div>생성일: {new Date(backupData.timestamp).toLocaleString('ko-KR')}</div>
                <div>버전: {backupData.version}</div>
                <div>
                  데이터: 신고 {backupData.metadata.totalReports}건,
                  게시글 {backupData.metadata.totalPosts}건,
                  댓글 {backupData.metadata.totalComments}건
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">백업 필요</span>
              </div>
              <div className="text-sm text-yellow-700 mt-1">
                마이그레이션 전에 데이터를 안전하게 백업해주세요.
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleCreateBackup}
              disabled={isProcessing}
              className="flex-1"
            >
              <Database className="h-4 w-4 mr-2" />
              {isProcessing ? '백업 생성 중...' : '백업 생성'}
            </Button>

            <Button
              onClick={handleDownloadBackup}
              variant="outline"
              disabled={!backupData}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              JSON 다운로드
            </Button>

            <Button
              onClick={handleClearBackup}
              variant="destructive"
              size="sm"
              disabled={!backupData}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Supabase 마이그레이션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Supabase 마이그레이션
          </CardTitle>
          <CardDescription>
            백업된 데이터를 Supabase 데이터베이스로 마이그레이션합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-700">
              <strong>마이그레이션 절차:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>LocalStorage 데이터 백업 생성</li>
                <li>Supabase SQL 마이그레이션 파일 생성</li>
                <li>Supabase 대시보드에서 SQL 실행</li>
                <li>데이터 검증 및 애플리케이션 전환</li>
              </ol>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerateMigrationSQL}
              disabled={!backupData || isProcessing}
              variant="secondary"
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isProcessing ? 'SQL 생성 중...' : 'Supabase SQL 생성'}
            </Button>
          </div>

          {!backupData && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                SQL 생성을 위해서는 먼저 데이터를 백업해야 합니다.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 주의사항 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            주의사항
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2 text-muted-foreground">
            <p>• 마이그레이션 전에 반드시 데이터를 백업하세요.</p>
            <p>• 마이그레이션 과정에서 데이터 손실이 발생할 수 있으니 주의하세요.</p>
            <p>• Supabase 환경변수가 올바르게 설정되어 있는지 확인하세요.</p>
            <p>• 마이그레이션 후에는 LocalStorage 데이터를 정리할 수 있습니다.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}