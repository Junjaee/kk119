'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Scale,
  User,
  Building2,
  Clock,
  Star,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface Lawyer {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  law_firm: string;
  is_verified: boolean;
  current_cases: number;
  max_cases: number;
  average_response_time: string;
  satisfaction_rating: number;
  years_experience: number;
  bio?: string;
}

interface LawyerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lawyers: Lawyer[];
  onSelectLawyer: (lawyer: Lawyer) => void;
  reportType: string;
}

export function LawyerSelectionModal({
  isOpen,
  onClose,
  lawyers,
  onSelectLawyer,
  reportType
}: LawyerSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating'); // rating, experience, availability, response_time

  // Get all unique specializations
  const allSpecializations = useMemo(() => {
    const specs = new Set<string>();
    lawyers.forEach(lawyer => {
      lawyer.specialization.forEach(spec => specs.add(spec));
    });
    return Array.from(specs).sort();
  }, [lawyers]);

  // Get recommended specializations based on report type
  const getRecommendedSpecs = (type: string) => {
    const recommendations: Record<string, string[]> = {
      parent: ['교육법', '민사소송', '손해배상'],
      student: ['학교폭력', '형사법', '아동복지법'],
      verbal: ['모독죄', '형사법', '정신적 피해'],
      defamation: ['명예훼손', '형사법', '민사소송'],
      harassment: ['성희롱', '형사법', '손해배상'],
      threat: ['협박죄', '형사법', '민사소송'],
      other: ['교육법', '민사소송']
    };
    return recommendations[type] || ['교육법'];
  };

  const recommendedSpecs = getRecommendedSpecs(reportType);

  // Filter and sort lawyers
  const filteredAndSortedLawyers = useMemo(() => {
    let filtered = lawyers.filter(lawyer => {
      const matchesSearch = lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lawyer.law_firm.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lawyer.specialization.some(spec =>
                             spec.toLowerCase().includes(searchTerm.toLowerCase())
                           );

      const matchesSpecialization = specializationFilter === 'all' ||
                                   lawyer.specialization.includes(specializationFilter);

      const matchesAvailability = availabilityFilter === 'all' ||
                                 (availabilityFilter === 'available' && lawyer.current_cases < lawyer.max_cases) ||
                                 (availabilityFilter === 'busy' && lawyer.current_cases >= lawyer.max_cases * 0.8) ||
                                 (availabilityFilter === 'light' && lawyer.current_cases <= lawyer.max_cases * 0.5);

      return matchesSearch && matchesSpecialization && matchesAvailability;
    });

    // Sort lawyers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.satisfaction_rating - a.satisfaction_rating;
        case 'experience':
          return b.years_experience - a.years_experience;
        case 'availability':
          return (a.current_cases / a.max_cases) - (b.current_cases / b.max_cases);
        case 'response_time':
          const aHours = parseInt(a.average_response_time.replace('시간', ''));
          const bHours = parseInt(b.average_response_time.replace('시간', ''));
          return aHours - bHours;
        default:
          return 0;
      }
    });

    return filtered;
  }, [lawyers, searchTerm, specializationFilter, availabilityFilter, sortBy]);


  const getWorkloadStatus = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return { label: '매우 바쁨', color: 'text-red-600' };
    if (percentage >= 70) return { label: '바쁨', color: 'text-yellow-600' };
    return { label: '여유있음', color: 'text-green-600' };
  };

  const isRecommended = (lawyer: Lawyer) => {
    return lawyer.specialization.some(spec => recommendedSpecs.includes(spec));
  };

  const handleSelectLawyer = (lawyer: Lawyer) => {
    onSelectLawyer(lawyer);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            변호사 선택
          </DialogTitle>
          <DialogDescription>
            신고 유형에 맞는 전문 변호사를 선택해주세요.
            <strong className="text-primary"> {recommendedSpecs.join(', ')} </strong>
            전문 변호사를 추천합니다.
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-4 py-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="변호사명, 로펌명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="전문분야" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 전문분야</SelectItem>
              {allSpecializations.map(spec => (
                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="업무량" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value="available">배정 가능</SelectItem>
              <SelectItem value="light">여유있음</SelectItem>
              <SelectItem value="busy">바쁨</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">평점 높은 순</SelectItem>
              <SelectItem value="experience">경력 많은 순</SelectItem>
              <SelectItem value="availability">여유있는 순</SelectItem>
              <SelectItem value="response_time">응답 빠른 순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lawyers List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {filteredAndSortedLawyers.map((lawyer) => {
            const workloadPercentage = (lawyer.current_cases / lawyer.max_cases) * 100;
            const workloadStatus = getWorkloadStatus(lawyer.current_cases, lawyer.max_cases);
            const recommended = isRecommended(lawyer);

            return (
              <Card key={lawyer.id} className={`hover:shadow-md transition-shadow cursor-pointer ${
                recommended ? 'ring-2 ring-primary/20 bg-primary/5' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{lawyer.name}</h3>
                          {recommended && (
                            <Badge variant="secondary" className="text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              추천
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{lawyer.satisfaction_rating}</span>
                        </div>
                      </div>

                      {/* Law Firm & Experience */}
                      <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          <span>{lawyer.law_firm}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{lawyer.years_experience}년 경력</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>평균 {lawyer.average_response_time} 응답</span>
                        </div>
                      </div>

                      {/* Specializations */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {lawyer.specialization.map((spec) => (
                          <Badge
                            key={spec}
                            variant={recommendedSpecs.includes(spec) ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {spec}
                          </Badge>
                        ))}
                      </div>

                      {/* Workload */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            현재 업무량
                          </span>
                          <span className={`font-medium ${workloadStatus.color}`}>
                            {workloadStatus.label} ({lawyer.current_cases}/{lawyer.max_cases}건)
                          </span>
                        </div>
                        <Progress
                          value={workloadPercentage}
                          className={`h-2 ${
                            workloadPercentage >= 90
                              ? '[&>div]:bg-red-500'
                              : workloadPercentage >= 70
                              ? '[&>div]:bg-yellow-500'
                              : '[&>div]:bg-green-500'
                          }`}
                        />
                      </div>

                      {/* Bio */}
                      {lawyer.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {lawyer.bio}
                        </p>
                      )}
                    </div>

                    {/* Select Button */}
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <Button
                        onClick={() => handleSelectLawyer(lawyer)}
                        disabled={lawyer.current_cases >= lawyer.max_cases}
                        size="sm"
                      >
                        {lawyer.current_cases >= lawyer.max_cases ? (
                          <>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            포화상태
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            선택
                          </>
                        )}
                      </Button>

                      {lawyer.is_verified && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          인증됨
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredAndSortedLawyers.length === 0 && (
            <div className="text-center py-8">
              <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">조건에 맞는 변호사가 없습니다</h3>
              <p className="text-muted-foreground">
                다른 검색 조건을 사용해보세요.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            총 {filteredAndSortedLawyers.length}명의 변호사가 검색되었습니다
            {recommendedSpecs.length > 0 && (
              <span className="ml-2">
                • <span className="text-primary font-medium">추천 전문분야:</span> {recommendedSpecs.join(', ')}
              </span>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}