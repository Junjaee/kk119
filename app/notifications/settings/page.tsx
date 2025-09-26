'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  ArrowLeft,
  Settings,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  Volume2,
  VolumeX,
  CheckCircle,
  Save,
  RotateCcw,
  AlertCircle,
  FileText,
  Scale,
  Building2,
  Shield,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/permission-guard';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

interface NotificationSettings {
  emailNotifications: {
    enabled: boolean;
    reportStatus: boolean;
    lawyerResponse: boolean;
    discussion: boolean;
    association: boolean;
    system: boolean;
  };
  pushNotifications: {
    enabled: boolean;
    reportStatus: boolean;
    lawyerResponse: boolean;
    discussion: boolean;
    association: boolean;
    system: boolean;
  };
  inAppNotifications: {
    enabled: boolean;
    reportStatus: boolean;
    lawyerResponse: boolean;
    discussion: boolean;
    association: boolean;
    system: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: {
    digest: 'realtime' | 'hourly' | 'daily' | 'weekly';
    summary: boolean;
  };
  priority: {
    minimumLevel: 'low' | 'medium' | 'high' | 'urgent';
    urgentOnly: boolean;
  };
}

const defaultSettings: NotificationSettings = {
  emailNotifications: {
    enabled: true,
    reportStatus: true,
    lawyerResponse: true,
    discussion: false,
    association: true,
    system: true,
  },
  pushNotifications: {
    enabled: true,
    reportStatus: true,
    lawyerResponse: true,
    discussion: true,
    association: false,
    system: false,
  },
  inAppNotifications: {
    enabled: true,
    reportStatus: true,
    lawyerResponse: true,
    discussion: true,
    association: true,
    system: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  frequency: {
    digest: 'realtime',
    summary: true,
  },
  priority: {
    minimumLevel: 'medium',
    urgentOnly: false,
  },
};

const notificationTypes = [
  {
    key: 'reportStatus',
    label: '신고서 상태 변경',
    description: '신고서의 처리 상태가 변경될 때',
    icon: FileText,
    color: 'text-blue-600',
  },
  {
    key: 'lawyerResponse',
    label: '변호사 상담 답변',
    description: '변호사가 상담에 답변을 등록했을 때',
    icon: Scale,
    color: 'text-purple-600',
  },
  {
    key: 'discussion',
    label: '토론 및 댓글',
    description: '공유 신고서나 커뮤니티에 새로운 토론이 있을 때',
    icon: MessageSquare,
    color: 'text-green-600',
  },
  {
    key: 'association',
    label: '협회 활동',
    description: '협회 가입, 승인, 공지사항 등',
    icon: Building2,
    color: 'text-orange-600',
  },
  {
    key: 'system',
    label: '시스템 공지',
    description: '시스템 점검, 업데이트, 중요 공지사항',
    icon: Shield,
    color: 'text-red-600',
  },
];

export default function NotificationSettingsPage() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load user settings
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem(`notification_settings_${profile?.id}`);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.id) {
      loadSettings();
    }
  }, [profile?.id]);

  // Track changes
  useEffect(() => {
    const initialSettings = JSON.stringify(defaultSettings);
    const currentSettings = JSON.stringify(settings);
    setHasChanges(initialSettings !== currentSettings);
  }, [settings]);

  const updateSettings = (section: keyof NotificationSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const toggleNotificationType = (section: keyof NotificationSettings, type: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [type]: !prev[section][type as keyof typeof prev[section]]
      }
    }));
  };

  const toggleSection = (section: keyof NotificationSettings) => {
    const newEnabled = !settings[section].enabled;
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        enabled: newEnabled,
        // If disabling, turn off all sub-options
        ...(newEnabled ? {} : {
          reportStatus: false,
          lawyerResponse: false,
          discussion: false,
          association: false,
          system: false,
        })
      }
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage (in real app, this would be an API call)
      localStorage.setItem(`notification_settings_${profile?.id}`, JSON.stringify(settings));

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('알림 설정이 저장되었습니다');
      setHasChanges(false);
    } catch (error) {
      toast.error('설정 저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    toast.success('설정이 초기화되었습니다');
  };

  const testNotification = async () => {
    try {
      // Test notification (mock)
      toast.success('테스트 알림이 전송되었습니다');
    } catch (error) {
      toast.error('테스트 알림 전송에 실패했습니다');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/notifications">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                알림 목록
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Settings className="h-8 w-8" />
                알림 설정
              </h1>
              <p className="text-muted-foreground mt-2">
                받고 싶은 알림의 종류와 방법을 설정하세요
              </p>
            </div>
          </div>

          {hasChanges && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                변경사항이 있습니다. 저장하지 않으면 설정이 적용되지 않습니다.
              </AlertDescription>
            </Alert>
          )}

          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                이메일 알림
                <label className="flex items-center ml-auto">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications.enabled}
                    onChange={() => toggleSection('emailNotifications')}
                    className="rounded mr-2"
                  />
                  활성화
                </label>
              </CardTitle>
              <CardDescription>
                선택한 활동에 대해 이메일로 알림을 받습니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${type.color}`} />
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications[type.key as keyof typeof settings.emailNotifications] as boolean}
                      onChange={() => toggleNotificationType('emailNotifications', type.key)}
                      disabled={!settings.emailNotifications.enabled}
                      className="rounded"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                푸시 알림
                <label className="flex items-center ml-auto">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications.enabled}
                    onChange={() => toggleSection('pushNotifications')}
                    className="rounded mr-2"
                  />
                  활성화
                </label>
              </CardTitle>
              <CardDescription>
                모바일 기기나 브라우저로 즉시 알림을 받습니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${type.color}`} />
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications[type.key as keyof typeof settings.pushNotifications] as boolean}
                      onChange={() => toggleNotificationType('pushNotifications', type.key)}
                      disabled={!settings.pushNotifications.enabled}
                      className="rounded"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* In-App Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                앱 내 알림
                <label className="flex items-center ml-auto">
                  <input
                    type="checkbox"
                    checked={settings.inAppNotifications.enabled}
                    onChange={() => toggleSection('inAppNotifications')}
                    className="rounded mr-2"
                  />
                  활성화
                </label>
              </CardTitle>
              <CardDescription>
                웹사이트 사용 중에 실시간으로 알림을 받습니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${type.color}`} />
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.inAppNotifications[type.key as keyof typeof settings.inAppNotifications] as boolean}
                      onChange={() => toggleNotificationType('inAppNotifications', type.key)}
                      disabled={!settings.inAppNotifications.enabled}
                      className="rounded"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {settings.quietHours.enabled ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                방해 금지 시간
                <label className="flex items-center ml-auto">
                  <input
                    type="checkbox"
                    checked={settings.quietHours.enabled}
                    onChange={() => updateSettings('quietHours', 'enabled', !settings.quietHours.enabled)}
                    className="rounded mr-2"
                  />
                  활성화
                </label>
              </CardTitle>
              <CardDescription>
                지정한 시간 동안 알림을 받지 않습니다 (긴급 알림 제외)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">시작 시간</Label>
                  <input
                    id="quiet-start"
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => updateSettings('quietHours', 'start', e.target.value)}
                    disabled={!settings.quietHours.enabled}
                    className="w-full p-2 border rounded-md disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-end">종료 시간</Label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => updateSettings('quietHours', 'end', e.target.value)}
                    disabled={!settings.quietHours.enabled}
                    className="w-full p-2 border rounded-md disabled:opacity-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Frequency & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Frequency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  알림 빈도
                </CardTitle>
                <CardDescription>
                  알림을 받을 빈도를 설정합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>알림 전송 방식</Label>
                  <Select
                    value={settings.frequency.digest}
                    onValueChange={(value) => updateSettings('frequency', 'digest', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">실시간</SelectItem>
                      <SelectItem value="hourly">1시간마다</SelectItem>
                      <SelectItem value="daily">하루에 한 번</SelectItem>
                      <SelectItem value="weekly">일주일에 한 번</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.frequency.summary}
                    onChange={(e) => updateSettings('frequency', 'summary', e.target.checked)}
                    className="rounded"
                  />
                  일일 요약 알림 받기
                </label>
              </CardContent>
            </Card>

            {/* Priority */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  우선순위 설정
                </CardTitle>
                <CardDescription>
                  받을 알림의 최소 우선순위를 설정합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>최소 우선순위</Label>
                  <Select
                    value={settings.priority.minimumLevel}
                    onValueChange={(value) => updateSettings('priority', 'minimumLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음 (모든 알림)</SelectItem>
                      <SelectItem value="medium">보통 (중요 알림만)</SelectItem>
                      <SelectItem value="high">높음 (중요한 알림만)</SelectItem>
                      <SelectItem value="urgent">긴급 (긴급 알림만)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.priority.urgentOnly}
                    onChange={(e) => updateSettings('priority', 'urgentOnly', e.target.checked)}
                    className="rounded"
                  />
                  긴급 알림만 받기
                </label>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetSettings}>
                <RotateCcw className="h-4 w-4 mr-2" />
                초기화
              </Button>
              <Button variant="outline" onClick={testNotification}>
                <Bell className="h-4 w-4 mr-2" />
                테스트 알림
              </Button>
            </div>

            <Button onClick={saveSettings} disabled={saving || !hasChanges}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  설정 저장
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>알림 설정 팁:</strong> 중요한 알림(신고서 상태 변경, 변호사 답변)은 항상 활성화하는 것을 권장합니다.
              방해 금지 시간을 설정하면 긴급 알림을 제외한 모든 알림이 해당 시간에는 전송되지 않습니다.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}