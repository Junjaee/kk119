---
id: STATS-001
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
author: @Goos
priority: medium
category: feature
labels: ["statistics", "dashboard", "analytics", "reporting"]
depends_on: ["REPORT-001", "CONSULT-001", "AUTH-001"]
---

# @SPEC:STATS-001: 통계 및 리포트 대시보드

## HISTORY

### v0.0.1 (2025-10-17)
- **INITIAL**: 통계 및 리포트 대시보드 명세 최초 작성
- **AUTHOR**: @Goos
- **SCOPE**: 신고/상담 통계, 시스템 메트릭, 데이터 시각화
- **CONTEXT**: KPI 측정 및 의사결정 지원을 위한 분석 도구

## Environment (환경)

### 시스템 환경
- **Database**: SQLite (kyokwon119.db, consult.db)
- **Framework**: Next.js 14 App Router
- **Charts**: Recharts or Chart.js
- **Export**: CSV, PDF generation
- **Cache**: In-memory or Redis (future)

### 사용자 역할
- **Teacher**: 본인 통계만 조회
- **Lawyer**: 본인 상담 통계 조회
- **Admin**: 협회 전체 통계 조회
- **Super Admin**: 시스템 전체 통계 조회

### 기술적 전제조건
- 실시간 데이터 집계
- 대용량 데이터 처리
- 차트 라이브러리 지원
- 데이터 export 기능

## Assumptions (가정)

### 비즈니스 가정
- 통계는 실시간으로 업데이트된다
- 과거 데이터는 영구 보관된다
- 역할별 접근 권한이 다르다
- 정기 리포트 자동 생성이 필요하다

### 기술적 가정
- 쿼리 응답 시간 2초 이내
- 차트 렌더링 1초 이내
- 데이터 정확도 100%
- 캐싱으로 성능 최적화

## Requirements (요구사항)

### Ubiquitous (필수 기능)
- 시스템은 신고 통계 조회 기능을 제공해야 한다
- 시스템은 상담 통계 조회 기능을 제공해야 한다
- 시스템은 시스템 메트릭 조회 기능을 제공해야 한다
- 시스템은 데이터 시각화 기능을 제공해야 한다
- 시스템은 데이터 export 기능을 제공해야 한다

### Event-driven (이벤트 기반)
- WHEN 관리자가 대시보드에 접근하면, 시스템은 실시간 통계를 표시해야 한다
- WHEN 기간 필터를 변경하면, 시스템은 즉시 데이터를 재집계해야 한다
- WHEN Export 버튼을 클릭하면, 시스템은 파일을 생성해야 한다
- WHEN 새로운 데이터가 추가되면, 시스템은 통계를 자동 업데이트해야 한다
- WHEN 임계값을 초과하면, 시스템은 알림을 발송해야 한다

### State-driven (상태 기반)
- WHILE 데이터가 로딩 중일 때, 시스템은 스켈레톤 UI를 표시해야 한다
- WHILE 필터가 적용 중일 때, 시스템은 필터 태그를 표시해야 한다
- WHILE 차트가 렌더링 중일 때, 시스템은 프로그레스를 표시해야 한다
- WHILE 데이터가 없을 때, 시스템은 Empty State를 표시해야 한다
- WHILE Export가 진행 중일 때, 시스템은 진행률을 표시해야 한다

### Optional (선택 기능)
- WHERE 사용자가 설정하면, 시스템은 정기 리포트를 자동 생성할 수 있다
- WHERE 필요하면, 시스템은 AI 기반 인사이트를 제공할 수 있다
- WHERE 요청하면, 시스템은 예측 분석을 수행할 수 있다
- WHERE 설정하면, 시스템은 대시보드를 커스터마이징할 수 있다

### Constraints (제약사항)
- IF 데이터가 10만 건 이상이면, 시스템은 페이지네이션을 적용해야 한다
- IF 쿼리가 2초 이상 걸리면, 시스템은 캐시를 사용해야 한다
- IF 차트 데이터가 1,000개 이상이면, 시스템은 집계해야 한다
- 날짜 범위는 최대 1년을 초과할 수 없어야 한다
- Export 파일은 10MB를 초과할 수 없어야 한다
- 동시 Export 요청은 3개로 제한되어야 한다

## Statistics Categories (통계 카테고리)

### 1. 신고 통계 (Report Statistics)
```yaml
metrics:
  - total_reports: 전체 신고 건수
  - daily_reports: 일별 신고 건수
  - weekly_reports: 주별 신고 건수
  - monthly_reports: 월별 신고 건수

  - by_category: 카테고리별 분포
    - 학부모 민원
    - 학생 폭력
    - 명예훼손
    - 기타

  - by_status: 상태별 분포
    - received: 접수
    - reviewing: 검토 중
    - consulting: 상담 중
    - completed: 완료

  - by_priority: 우선순위별 분포
    - urgent: 긴급
    - high: 높음
    - normal: 보통
    - low: 낮음

  - avg_resolution_time: 평균 처리 시간
  - resolution_rate: 해결률
```

### 2. 상담 통계 (Consultation Statistics)
```yaml
metrics:
  - total_consultations: 전체 상담 건수
  - active_consultations: 진행 중 상담
  - completed_consultations: 완료된 상담
  - completion_rate: 상담 완료율 (목표: 95%)

  - by_lawyer: 변호사별 통계
    - assigned_count: 배정 건수
    - completed_count: 완료 건수
    - avg_rating: 평균 평점
    - response_time: 평균 응답 시간

  - matching_metrics: 매칭 지표
    - avg_matching_time: 평균 매칭 시간
    - matching_success_rate: 매칭 성공률
    - rematch_rate: 재매칭 비율

  - satisfaction: 만족도
    - avg_rating: 평균 평점
    - rating_distribution: 평점 분포
    - feedback_count: 피드백 수
```

### 3. 시스템 통계 (System Statistics)
```yaml
metrics:
  - users: 사용자 통계
    - total_users: 전체 사용자
    - active_users: 활성 사용자
    - new_users: 신규 가입자
    - dau: 일간 활성 사용자
    - mau: 월간 활성 사용자
    - by_role: 역할별 분포

  - performance: 성능 지표
    - avg_response_time: 평균 응답 시간
    - uptime: 가용성
    - error_rate: 에러율
    - api_calls: API 호출 수

  - engagement: 참여도
    - avg_session_duration: 평균 세션 시간
    - page_views: 페이지 뷰
    - bounce_rate: 이탈률
    - retention_rate: 재방문율
```

### 4. KPI 대시보드
```yaml
primary_kpis:
  - monthly_reports: 월 1,000건 목표
  - completion_rate: 95% 목표
  - response_time: 2초 이내
  - user_satisfaction: 4.0/5.0

secondary_kpis:
  - lawyer_utilization: 변호사 가동률
  - resolution_time: 평균 해결 시간
  - system_health: 시스템 상태
  - growth_rate: 성장률
```

## Data Model (데이터 모델)

### stats_cache 테이블
```sql
CREATE TABLE stats_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_type VARCHAR(50) NOT NULL,
  date_range VARCHAR(30) NOT NULL,
  filters JSON,
  data JSON NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  UNIQUE(stat_type, date_range, filters)
);

CREATE INDEX idx_stats_cache_type ON stats_cache(stat_type);
CREATE INDEX idx_stats_cache_expires ON stats_cache(expires_at);
```

### report_aggregates 테이블 (일별 집계)
```sql
CREATE TABLE report_aggregates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  total_count INTEGER DEFAULT 0,
  by_category JSON,
  by_status JSON,
  by_priority JSON,
  avg_resolution_hours DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date)
);
```

### consult_aggregates 테이블 (일별 집계)
```sql
CREATE TABLE consult_aggregates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  total_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  avg_matching_minutes DECIMAL(10,2),
  avg_rating DECIMAL(3,2),
  by_lawyer JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date)
);
```

## API Endpoints

### 통계 조회
- `GET /api/stats/reports` - 신고 통계
- `GET /api/stats/consultations` - 상담 통계
- `GET /api/stats/system` - 시스템 통계
- `GET /api/stats/kpi` - KPI 대시보드
- `GET /api/stats/summary` - 종합 요약

### 필터 및 집계
- `POST /api/stats/aggregate` - 커스텀 집계
- `GET /api/stats/filters` - 필터 옵션
- `GET /api/stats/compare` - 기간 비교

### Export
- `POST /api/stats/export/csv` - CSV 내보내기
- `POST /api/stats/export/pdf` - PDF 리포트
- `GET /api/stats/export/status/:id` - Export 상태

### 실시간 업데이트
- `GET /api/stats/realtime` - 실시간 스트림
- `WS /api/stats/subscribe` - WebSocket 구독

## Chart Components

### 1. Line Charts (추세)
```typescript
interface TrendChart {
  data: TimeSeriesData[];
  xAxis: 'date';
  yAxis: string[];
  interval: 'day' | 'week' | 'month';
  showTrend: boolean;
}
```

### 2. Bar Charts (비교)
```typescript
interface ComparisonChart {
  data: CategoryData[];
  orientation: 'vertical' | 'horizontal';
  stacked: boolean;
  showValues: boolean;
}
```

### 3. Pie Charts (분포)
```typescript
interface DistributionChart {
  data: SegmentData[];
  showPercentage: boolean;
  showLegend: boolean;
  interactive: boolean;
}
```

### 4. Heat Maps (패턴)
```typescript
interface HeatMap {
  data: MatrixData[][];
  xAxis: string[];
  yAxis: string[];
  colorScale: ColorScale;
}
```

### 5. KPI Cards
```typescript
interface KPICard {
  title: string;
  value: number | string;
  target?: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  sparkline?: number[];
}
```

## Performance Optimization

### Query Optimization
```sql
-- 인덱스 생성
CREATE INDEX idx_reports_created ON reports(created_at);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_consults_created ON consults(created_at);
CREATE INDEX idx_consults_status ON consults(status);

-- 파티셔닝 (월별)
CREATE VIEW reports_current_month AS
SELECT * FROM reports
WHERE created_at >= date('now', 'start of month');

-- Materialized View (일별 집계)
CREATE TRIGGER update_daily_aggregates
AFTER INSERT ON reports
BEGIN
  INSERT OR REPLACE INTO report_aggregates (date, total_count)
  VALUES (date('now'),
    (SELECT COUNT(*) FROM reports WHERE date(created_at) = date('now'))
  );
END;
```

### Caching Strategy
```yaml
cache_ttl:
  realtime: 10s
  hourly: 1h
  daily: 24h
  monthly: 7d

cache_invalidation:
  on_create: true
  on_update: true
  scheduled: "0 * * * *"  # 매시 정각
```

### Data Aggregation
```typescript
// 실시간 집계
const realtimeAggregation = async () => {
  return db.query(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN created_at > datetime('now', '-1 hour') THEN 1 END) as last_hour,
      COUNT(CASE WHEN created_at > datetime('now', '-24 hours') THEN 1 END) as last_day
    FROM reports
  `);
};

// 배치 집계 (일별)
const batchAggregation = async () => {
  // 새벽 2시 실행
  await aggregateDaily();
  await aggregateWeekly();
  await aggregateMonthly();
};
```

## Dashboard Layout

### Admin Dashboard
```
┌─────────────────────────────────────────────┐
│                  KPI Cards                  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │Reports││Consults││Users││Health│          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
├─────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐         │
│  │ Trend Chart  │ │ Distribution │         │
│  └──────────────┘ └──────────────┘         │
├─────────────────────────────────────────────┤
│  ┌──────────────────────────────┐          │
│  │    Data Table with Export    │          │
│  └──────────────────────────────┘          │
└─────────────────────────────────────────────┘
```

## Security & Access Control

### Role-based Access
```yaml
teacher:
  - view: own_reports
  - export: own_data

lawyer:
  - view: assigned_consults
  - export: consult_reports

admin:
  - view: organization_stats
  - export: all_reports
  - create: custom_reports

super_admin:
  - view: all_stats
  - export: all_data
  - modify: dashboard_config
```

### Data Privacy
- PII 마스킹 처리
- 집계 데이터만 표시
- 개인 식별 불가능
- 익명화된 Export

## Monitoring & Alerts

### Performance Monitoring
- Query execution time
- Cache hit rate
- Dashboard load time
- Export generation time

### Business Alerts
- KPI 목표 미달성
- 이상 패턴 감지
- 급격한 변화 알림
- 정기 리포트 실패

## Traceability (@TAG)

- **SPEC**: @SPEC:STATS-001
- **TEST**: tests/stats/test_dashboard.py
- **CODE**: src/stats/dashboard-service.ts
- **DOC**: docs/api/statistics.md
- **CHARTS**: components/charts/