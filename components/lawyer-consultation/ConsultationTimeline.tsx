'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Calendar,
  Clock,
  User,
  UserCheck,
  MessageSquare,
  FileText,
  CheckCircle2,
  AlertCircle,
  Send,
  Download,
  Eye,
  MessageCircle2,
  Scale,
  Archive,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { useState } from 'react';

type TimelineEventType =
  | 'report_created'
  | 'lawyer_assigned'
  | 'consultation_started'
  | 'additional_question'
  | 'lawyer_response'
  | 'status_updated'
  | 'consultation_completed'
  | 'rating_submitted';

interface TimelineActor {
  id: string;
  name: string;
  email: string;
  role: 'reporter' | 'lawyer' | 'admin' | 'super_admin';
}

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  actor: TimelineActor;
  title: string;
  description?: string;
  details?: string;
  attachments?: string[];
  metadata?: Record<string, any>;
}

interface ConsultationTimelineProps {
  reportId: string;
  events: TimelineEvent[];
  variant?: 'detailed' | 'compact';
  showFilters?: boolean;
  maxEvents?: number;
}

const eventTypeConfig: Record<TimelineEventType, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  report_created: {
    icon: <FileText className="h-4 w-4" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    label: '신고 접수'
  },
  lawyer_assigned: {
    icon: <UserCheck className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    label: '변호사 배정'
  },
  consultation_started: {
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    label: '상담 시작'
  },
  additional_question: {
    icon: <MessageCircle2 className="h-4 w-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    label: '추가 질문'
  },
  lawyer_response: {
    icon: <Scale className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    label: '변호사 답변'
  },
  status_updated: {
    icon: <Activity className="h-4 w-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    label: '상태 변경'
  },
  consultation_completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    label: '상담 완료'
  },
  rating_submitted: {
    icon: <Archive className="h-4 w-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    label: '평가 제출'
  }
};

const roleConfig = {
  reporter: { label: '신고자', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  lawyer: { label: '변호사', color: 'text-green-600', bgColor: 'bg-green-50' },
  admin: { label: '관리자', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  super_admin: { label: '최고관리자', color: 'text-red-600', bgColor: 'bg-red-50' }
};

export function ConsultationTimeline({
  reportId,
  events,
  variant = 'detailed',
  showFilters = true,
  maxEvents = 20
}: ConsultationTimelineProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [filterType, setFilterType] = useState<TimelineEventType | 'all'>('all');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const filteredEvents = events
    .filter(event => filterType === 'all' || event.type === filterType)
    .slice(0, showAllEvents ? undefined : maxEvents);

  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (variant === 'compact') {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Clock className="h-5 w-5 text-gray-600" />
            <span>상담 히스토리</span>
            <Badge variant="outline">{events.length}개 이벤트</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedEvents.slice(0, 5).map((event) => {
            const eventConfig = eventTypeConfig[event.type];
            return (
              <div key={event.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0',
                  eventConfig.bgColor,
                  eventConfig.borderColor,
                  eventConfig.color
                )}>
                  {eventConfig.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {event.title}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                    {event.description}
                  </p>
                </div>
              </div>
            );
          })}
          {events.length > 5 && (
            <div className="text-center pt-2">
              <Button variant="ghost" size="sm" className="text-xs">
                전체 히스토리 보기 ({events.length - 5}개 더)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50">
      <CardHeader className="border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-gray-900 dark:text-gray-100">상담 히스토리</span>
            <Badge variant="outline" className="ml-2">
              {events.length}개 이벤트
            </Badge>
          </CardTitle>

          {showFilters && (
            <div className="flex items-center space-x-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TimelineEventType | 'all')}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 bg-white dark:bg-gray-800 dark:border-gray-600"
              >
                <option value="all">전체</option>
                {Object.entries(eventTypeConfig).map(([type, config]) => (
                  <option key={type} value={type}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">아직 상담 이력이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedEvents.map((event, index) => {
              const eventConfig = eventTypeConfig[event.type];
              const roleInfo = roleConfig[event.actor.role];
              const isExpanded = expandedEvents.has(event.id);
              const hasExpandableContent = event.details || event.attachments?.length;

              return (
                <div key={event.id} className="relative">
                  {/* Timeline connector line */}
                  {index < sortedEvents.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-6 bg-gray-200 dark:bg-gray-700" />
                  )}

                  <div className="flex items-start space-x-4">
                    {/* Event icon */}
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-sm z-10',
                      eventConfig.bgColor,
                      eventConfig.borderColor,
                      eventConfig.color
                    )}>
                      {eventConfig.icon}
                    </div>

                    {/* Event content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {event.title}
                              </h3>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs',
                                  eventConfig.color,
                                  eventConfig.bgColor,
                                  eventConfig.borderColor
                                )}
                              >
                                {eventConfig.label}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {formatDate(event.timestamp)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formatRelativeTime(event.timestamp)}
                              </div>
                            </div>
                          </div>

                          {/* Actor information */}
                          <div className="flex items-center space-x-3 mb-3">
                            <Avatar className="h-8 w-8 border-2 border-gray-200 dark:border-gray-700">
                              <AvatarImage src="" alt={event.actor.name} />
                              <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">
                                {getInitials(event.actor.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {event.actor.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs px-2 py-0.5',
                                    roleInfo.color,
                                    roleInfo.bgColor
                                  )}
                                >
                                  {roleInfo.label}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {event.actor.email}
                              </div>
                            </div>
                          </div>

                          {/* Event description */}
                          {event.description && (
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                              {event.description}
                            </p>
                          )}

                          {/* Expandable details */}
                          {hasExpandableContent && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleEventExpansion(event.id)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 mb-3"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-4 w-4 mr-1" />
                                    간략히 보기
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4 mr-1" />
                                    자세히 보기
                                  </>
                                )}
                              </Button>

                              {isExpanded && (
                                <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                  {event.details && (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        상세 내용
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                                        {event.details}
                                      </p>
                                    </div>
                                  )}

                                  {event.attachments && event.attachments.length > 0 && (
                                    <div>
                                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        첨부 파일 ({event.attachments.length}개)
                                      </div>
                                      <div className="grid gap-2">
                                        {event.attachments.map((attachment, attachIndex) => (
                                          <div
                                            key={attachIndex}
                                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                          >
                                            <div className="flex items-center space-x-2">
                                              <FileText className="h-4 w-4 text-gray-500" />
                                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                                {attachment}
                                              </span>
                                            </div>
                                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                              <Download className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                        추가 정보
                                      </div>
                                      <div className="space-y-1">
                                        {Object.entries(event.metadata).map(([key, value]) => (
                                          <div key={key} className="flex justify-between text-xs">
                                            <span className="text-blue-600 dark:text-blue-300">{key}:</span>
                                            <span className="text-blue-800 dark:text-blue-200">{String(value)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load more button */}
            {!showAllEvents && events.length > maxEvents && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAllEvents(true)}
                  className="bg-white hover:bg-gray-50 border-gray-300"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  더 많은 이력 보기 ({events.length - maxEvents}개 더)
                </Button>
              </div>
            )}

            {showAllEvents && events.length > maxEvents && (
              <div className="text-center pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAllEvents(false)}
                  className="text-sm"
                >
                  <ChevronUp className="h-4 w-4 mr-1" />
                  간략히 보기
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}