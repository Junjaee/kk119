'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  Building2,
  Award,
  Star,
  Calendar,
  Clock,
  Shield
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

interface LawyerInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization: string[];
  law_firm: string;
  experience_years?: number;
  rating?: number;
  cases_handled?: number;
  bio?: string;
  license_number?: string;
}

interface LawyerAssignmentInfo {
  assigned_at: string;
  assigned_by?: {
    id: string;
    name: string;
    email: string;
  };
  consultation_priority?: 'low' | 'medium' | 'high' | 'urgent';
  consultation_notes?: string;
}

interface LawyerProfileProps {
  lawyer: LawyerInfo;
  assignment?: LawyerAssignmentInfo;
  showContactInfo?: boolean;
  variant?: 'full' | 'compact';
}

const priorityConfig = {
  low: {
    label: '일반',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
    borderColor: 'border-gray-300 dark:border-gray-600'
  },
  medium: {
    label: '보통',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-300 dark:border-blue-600'
  },
  high: {
    label: '중요',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-300 dark:border-amber-600'
  },
  urgent: {
    label: '긴급',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-300 dark:border-red-600'
  }
};

export function LawyerProfile({
  lawyer,
  assignment,
  showContactInfo = false,
  variant = 'full'
}: LawyerProfileProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
        <Avatar className="h-12 w-12 border-2 border-blue-300 dark:border-blue-600">
          <AvatarImage src="" alt={lawyer.name} />
          <AvatarFallback className="bg-blue-600 text-white font-semibold">
            {getInitials(lawyer.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {lawyer.name}
            </h3>
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600">
              변호사
            </Badge>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Building2 className="h-4 w-4" />
              <span className="truncate">{lawyer.law_firm}</span>
            </div>

            {assignment?.assigned_at && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatRelativeTime(assignment.assigned_at)} 배정</span>
              </div>
            )}
          </div>
        </div>

        {assignment?.consultation_priority && (
          <div className={cn(
            'px-3 py-1 rounded-full text-sm font-medium border',
            priorityConfig[assignment.consultation_priority].bgColor,
            priorityConfig[assignment.consultation_priority].textColor,
            priorityConfig[assignment.consultation_priority].borderColor
          )}>
            {priorityConfig[assignment.consultation_priority].label}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-950/30">
      <CardHeader className="border-b border-blue-100 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardTitle className="flex items-center space-x-3 text-xl">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-gray-900 dark:text-gray-100">담당 변호사</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Lawyer Basic Info */}
          <div className="flex items-start space-x-6">
            <Avatar className="h-20 w-20 border-4 border-blue-300 dark:border-blue-600">
              <AvatarImage src="" alt={lawyer.name} />
              <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                {getInitials(lawyer.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {lawyer.name}
                  </h3>
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                    변호사
                  </Badge>
                  {lawyer.license_number && (
                    <Badge variant="outline" className="text-xs">
                      면허번호: {lawyer.license_number}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{lawyer.law_firm}</span>
                  </div>

                  {lawyer.experience_years && (
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4" />
                      <span>경력 {lawyer.experience_years}년</span>
                    </div>
                  )}

                  {lawyer.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{lawyer.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Specializations */}
              {lawyer.specialization && lawyer.specialization.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    전문 분야
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {lawyer.specialization.map((spec, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30
                                 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600"
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {showContactInfo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <a
                      href={`mailto:${lawyer.email}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:underline truncate"
                    >
                      {lawyer.email}
                    </a>
                  </div>

                  {lawyer.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-green-600" />
                      <a
                        href={`tel:${lawyer.phone}`}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 hover:underline"
                      >
                        {lawyer.phone}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Statistics */}
              {(lawyer.cases_handled || lawyer.rating) && (
                <div className="flex items-center space-x-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {lawyer.cases_handled && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {lawyer.cases_handled}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        처리 사건
                      </div>
                    </div>
                  )}

                  {lawyer.rating && (
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {lawyer.rating.toFixed(1)}
                        </span>
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        평점
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {lawyer.bio && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                소개
              </h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {lawyer.bio}
              </p>
            </div>
          )}

          {/* Assignment Information */}
          {assignment && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>배정 정보</span>
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">배정일시</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(assignment.assigned_at)} ({formatRelativeTime(assignment.assigned_at)})
                  </span>
                </div>

                {assignment.assigned_by && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">배정자</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {assignment.assigned_by.name}
                    </span>
                  </div>
                )}

                {assignment.consultation_priority && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">우선순위</span>
                    <div className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium border',
                      priorityConfig[assignment.consultation_priority].bgColor,
                      priorityConfig[assignment.consultation_priority].textColor,
                      priorityConfig[assignment.consultation_priority].borderColor
                    )}>
                      {priorityConfig[assignment.consultation_priority].label}
                    </div>
                  </div>
                )}

                {assignment.consultation_notes && (
                  <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      배정 메모
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                      {assignment.consultation_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}