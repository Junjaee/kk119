'use client';

export const dynamic = 'force-dynamic';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Settings,
  Shield,
  Bell,
  Mail,
  Database,
  Users,
  FileText,
  Globe,
  Lock,
  Clock,
  AlertTriangle,
  Save,
  RotateCcw,
  Download,
  Upload
} from 'lucide-react';
import { useState } from 'react';

export default function SystemSettingsPage() {
  const { user } = useStore();

  // Settings state
  const [settings, setSettings] = useState({
    // 일반 설정
    siteName: '교권119',
    siteDescription: '교원 권익 보호를 위한 종합 플랫폼',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,

    // 알림 설정
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    adminNotifications: true,

    // 보안 설정
    passwordMinLength: 8,
    sessionTimeout: 7, // days
    maxLoginAttempts: 5,
    twoFactorAuth: false,

    // 파일 업로드 설정
    maxFileSize: 10, // MB
    allowedFileTypes: 'pdf,doc,docx,hwp,jpg,jpeg,png',

    // 이메일 설정
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: 'noreply@kk119.com',
    fromName: '교권119'
  });

  // 슈퍼어드민 권한 확인
  if (user?.role !== 'super_admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h1>
          <p className="text-muted-foreground">
            이 페이지는 슈퍼어드민만 접근할 수 있습니다.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const handleSave = () => {
    // TODO: API 호출로 설정 저장
    console.log('Settings saved:', settings);
    alert('설정이 저장되었습니다.');
  };

  const handleReset = () => {
    if (confirm('설정을 초기값으로 되돌리시겠습니까?')) {
      // TODO: 기본 설정값으로 리셋
      console.log('Settings reset to default');
      alert('설정이 초기화되었습니다.');
    }
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'kk119-settings.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <a href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              관리자 대시보드
            </a>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              시스템 설정
            </h1>
            <p className="text-muted-foreground">
              교권119 시스템의 전반적인 설정을 관리합니다
            </p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            설정 저장
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            초기화
          </Button>
          <Button variant="outline" onClick={handleExportSettings}>
            <Download className="h-4 w-4 mr-2" />
            설정 내보내기
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            설정 가져오기
          </Button>
        </div>

        {/* 시스템 상태 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              시스템 상태
            </CardTitle>
            <CardDescription>
              현재 시스템의 운영 상태를 확인합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <span className="text-sm font-medium">서버 상태</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  정상 운영
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <span className="text-sm font-medium">데이터베이스</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  연결됨
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <span className="text-sm font-medium">유지보수 모드</span>
                <Badge variant="outline" className={settings.maintenanceMode ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"}>
                  {settings.maintenanceMode ? '활성화' : '비활성화'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 일반 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                일반 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siteName">사이트 이름</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="siteDescription">사이트 설명</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode">유지보수 모드</Label>
                  <p className="text-sm text-muted-foreground">활성화시 관리자만 접근 가능</p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="registrationEnabled">회원가입 허용</Label>
                  <p className="text-sm text-muted-foreground">신규 사용자 등록 가능 여부</p>
                </div>
                <Switch
                  id="registrationEnabled"
                  checked={settings.registrationEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, registrationEnabled: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailVerificationRequired">이메일 인증 필수</Label>
                  <p className="text-sm text-muted-foreground">회원가입시 이메일 인증 필요</p>
                </div>
                <Switch
                  id="emailVerificationRequired"
                  checked={settings.emailVerificationRequired}
                  onCheckedChange={(checked) => setSettings({...settings, emailVerificationRequired: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* 보안 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                보안 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="passwordMinLength">최소 비밀번호 길이</Label>
                <Input
                  id="passwordMinLength"
                  type="number"
                  min="6"
                  max="20"
                  value={settings.passwordMinLength}
                  onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <Label htmlFor="sessionTimeout">세션 유지 기간 (일)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <Label htmlFor="maxLoginAttempts">최대 로그인 시도 횟수</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  min="3"
                  max="10"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="twoFactorAuth">2단계 인증</Label>
                  <p className="text-sm text-muted-foreground">관리자 계정 2FA 활성화</p>
                </div>
                <Switch
                  id="twoFactorAuth"
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* 알림 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                알림 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">이메일 알림</Label>
                  <p className="text-sm text-muted-foreground">새 신고 접수시 이메일 발송</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smsNotifications">SMS 알림</Label>
                  <p className="text-sm text-muted-foreground">긴급 신고시 SMS 발송</p>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, smsNotifications: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pushNotifications">푸시 알림</Label>
                  <p className="text-sm text-muted-foreground">브라우저 푸시 알림</p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="adminNotifications">관리자 알림</Label>
                  <p className="text-sm text-muted-foreground">시스템 이벤트 알림</p>
                </div>
                <Switch
                  id="adminNotifications"
                  checked={settings.adminNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, adminNotifications: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* 파일 업로드 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                파일 업로드 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="maxFileSize">최대 파일 크기 (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.maxFileSize}
                  onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <Label htmlFor="allowedFileTypes">허용 파일 형식</Label>
                <Input
                  id="allowedFileTypes"
                  value={settings.allowedFileTypes}
                  onChange={(e) => setSettings({...settings, allowedFileTypes: e.target.value})}
                  placeholder="pdf,doc,docx,hwp,jpg,jpeg,png"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  쉼표로 구분하여 입력 (예: pdf,doc,docx,hwp)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 이메일 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              이메일 서버 설정
            </CardTitle>
            <CardDescription>
              시스템에서 발송하는 이메일을 위한 SMTP 서버 설정
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpHost">SMTP 호스트</Label>
                <Input
                  id="smtpHost"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div>
                <Label htmlFor="smtpPort">SMTP 포트</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({...settings, smtpPort: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <Label htmlFor="smtpUsername">SMTP 사용자명</Label>
                <Input
                  id="smtpUsername"
                  value={settings.smtpUsername}
                  onChange={(e) => setSettings({...settings, smtpUsername: e.target.value})}
                  placeholder="이메일 주소"
                />
              </div>

              <div>
                <Label htmlFor="smtpPassword">SMTP 비밀번호</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  value={settings.smtpPassword}
                  onChange={(e) => setSettings({...settings, smtpPassword: e.target.value})}
                  placeholder="앱 비밀번호"
                />
              </div>

              <div>
                <Label htmlFor="fromEmail">발신자 이메일</Label>
                <Input
                  id="fromEmail"
                  value={settings.fromEmail}
                  onChange={(e) => setSettings({...settings, fromEmail: e.target.value})}
                  placeholder="noreply@kk119.com"
                />
              </div>

              <div>
                <Label htmlFor="fromName">발신자 이름</Label>
                <Input
                  id="fromName"
                  value={settings.fromName}
                  onChange={(e) => setSettings({...settings, fromName: e.target.value})}
                  placeholder="교권119"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                이메일 테스트 발송
              </Button>
              <Button variant="outline">
                <Database className="h-4 w-4 mr-2" />
                연결 테스트
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 경고 메시지 */}
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <CardContent className="pt-6">
            <div className="flex space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                <p className="font-semibold mb-2">시스템 설정 변경 주의사항</p>
                <ul className="space-y-1 list-disc list-inside text-xs">
                  <li>설정 변경 후 반드시 '설정 저장' 버튼을 클릭하세요.</li>
                  <li>보안 설정 변경시 모든 사용자의 세션이 초기화될 수 있습니다.</li>
                  <li>유지보수 모드 활성화시 일반 사용자는 접근할 수 없습니다.</li>
                  <li>이메일 설정 변경시 이메일 발송 기능에 영향을 줄 수 있습니다.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}