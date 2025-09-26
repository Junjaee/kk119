# 교권119 API 문서

## 📋 개요

교권119 시스템의 REST API 엔드포인트 문서입니다. 모든 API는 Next.js App Router 기반으로 구현되어 있습니다.

## 🔐 인증

### 인증 방식
- **Supabase Auth**: JWT 토큰 기반 인증
- **Session**: HTTP-only 쿠키를 통한 세션 관리
- **CORS**: 동일 출처 정책 적용

### 권한 레벨
| 권한 | 설명 | 접근 가능 리소스 |
|------|------|------------------|
| `super_admin` | 최고관리자 | 전체 시스템 |
| `admin` | 협회관리자 | 소속 협회 내 모든 데이터 |
| `lawyer` | 변호사 | 법률 상담, 담당 사건 |
| `teacher` | 교사 | 개인 데이터, 커뮤니티 |

## 🛡️ 시스템 API

### Health Check

#### `GET /api/health`
시스템 상태 확인

**요청**
```http
GET /api/health
```

**응답**
```json
{
  "status": "ok",
  "timestamp": "2025-09-22T04:30:00.000Z",
  "service": "교권119"
}
```

**상태 코드**
- `200`: 시스템 정상

---

## 🔐 인증 API

### 로그인

#### `POST /api/auth/login`
사용자 로그인

**요청**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "teacher@school.ac.kr",
  "password": "password123"
}
```

**응답**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "teacher@school.ac.kr",
    "name": "홍길동",
    "role": "teacher",
    "is_verified": true
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "expires_at": "2025-09-23T04:30:00.000Z"
  }
}
```

**오류 응답**
```json
{
  "error": "이메일 또는 비밀번호가 올바르지 않습니다."
}
```

**상태 코드**
- `200`: 로그인 성공
- `400`: 잘못된 요청 (필수 필드 누락)
- `401`: 인증 실패
- `403`: 계정 비활성화 또는 미승인

### 회원가입

#### `POST /api/auth/signup`
새 사용자 계정 생성

**요청**
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "newteacher@school.ac.kr",
  "password": "securePassword123!",
  "name": "김교사",
  "role": "teacher",
  "school_name": "서울중학교",
  "employee_id": "T2025001",
  "phone": "010-1234-5678"
}
```

**응답**
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.",
  "user": {
    "id": "uuid",
    "email": "newteacher@school.ac.kr",
    "name": "김교사",
    "role": "teacher",
    "is_verified": false
  }
}
```

**상태 코드**
- `201`: 회원가입 성공
- `400`: 잘못된 요청
- `409`: 이미 존재하는 이메일

### 현재 사용자 정보

#### `GET /api/auth/me`
현재 로그인된 사용자 정보 조회

**요청**
```http
GET /api/auth/me
Authorization: Bearer jwt-token
```

**응답**
```json
{
  "user": {
    "id": "uuid",
    "email": "teacher@school.ac.kr",
    "name": "홍길동",
    "role": "teacher",
    "school_name": "서울중학교",
    "is_verified": true,
    "is_active": true,
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

### 로그아웃

#### `POST /api/auth/logout`
사용자 로그아웃

**요청**
```http
POST /api/auth/logout
Authorization: Bearer jwt-token
```

**응답**
```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

---

## 👥 커뮤니티 API

### 게시글 목록 조회

#### `GET /api/community/posts`
커뮤니티 게시글 목록 조회

**요청**
```http
GET /api/community/posts?category=experience&page=1&limit=20
```

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `category` | string | 아니오 | 카테고리 필터 (`general`, `experience`, `advice`, `legal`, `support`) |
| `page` | integer | 아니오 | 페이지 번호 (기본값: 1) |
| `limit` | integer | 아니오 | 페이지 크기 (기본값: 20, 최대: 100) |
| `search` | string | 아니오 | 검색어 |

**응답**
```json
{
  "posts": [
    {
      "id": "uuid",
      "title": "교권 침해 대응 경험 공유",
      "content": "최근 경험을 공유합니다...",
      "category": "experience",
      "author": {
        "id": "uuid",
        "name": "익명교사",
        "is_anonymous": false
      },
      "like_count": 15,
      "comment_count": 8,
      "view_count": 142,
      "created_at": "2025-09-20T10:00:00.000Z",
      "updated_at": "2025-09-20T10:00:00.000Z"
    }
  ],
  "totalCount": 156,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### 게시글 작성

#### `POST /api/community/posts`
새 게시글 작성

**요청**
```http
POST /api/community/posts
Authorization: Bearer jwt-token
Content-Type: application/json

{
  "title": "새로운 게시글 제목",
  "content": "게시글 내용입니다.",
  "category": "experience",
  "is_anonymous": false,
  "tags": ["교권침해", "대응방법"]
}
```

**응답**
```json
{
  "success": true,
  "post": {
    "id": "uuid",
    "title": "새로운 게시글 제목",
    "content": "게시글 내용입니다.",
    "category": "experience",
    "author_id": "uuid",
    "is_anonymous": false,
    "tags": ["교권침해", "대응방법"],
    "created_at": "2025-09-22T04:30:00.000Z"
  }
}
```

### 특정 게시글 조회

#### `GET /api/community/posts/{id}`
특정 게시글 상세 조회

**요청**
```http
GET /api/community/posts/550e8400-e29b-41d4-a716-446655440000
```

**응답**
```json
{
  "post": {
    "id": "uuid",
    "title": "게시글 제목",
    "content": "게시글 상세 내용...",
    "category": "experience",
    "author": {
      "id": "uuid",
      "name": "작성자명",
      "avatar_url": null
    },
    "like_count": 25,
    "view_count": 250,
    "is_liked": false,
    "tags": ["태그1", "태그2"],
    "created_at": "2025-09-20T10:00:00.000Z",
    "updated_at": "2025-09-20T15:30:00.000Z"
  },
  "comments": [
    {
      "id": "uuid",
      "content": "댓글 내용",
      "author": {
        "id": "uuid",
        "name": "댓글작성자"
      },
      "like_count": 3,
      "created_at": "2025-09-20T11:00:00.000Z"
    }
  ]
}
```

### 게시글 수정

#### `PUT /api/community/posts/{id}`
게시글 수정 (작성자 또는 관리자만 가능)

**요청**
```http
PUT /api/community/posts/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer jwt-token
Content-Type: application/json

{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "category": "advice"
}
```

### 게시글 삭제

#### `DELETE /api/community/posts/{id}`
게시글 삭제 (작성자 또는 관리자만 가능)

**요청**
```http
DELETE /api/community/posts/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer jwt-token
```

---

## 📋 신고 API

### 신고 목록 조회

#### `GET /api/reports`
신고 내역 조회

**요청**
```http
GET /api/reports?status=pending&page=1&limit=10
```

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `status` | string | 아니오 | 상태 필터 (`submitted`, `investigating`, `consulting`, `resolved`, `closed`) |
| `urgency` | integer | 아니오 | 긴급도 (1-5) |
| `page` | integer | 아니오 | 페이지 번호 |
| `limit` | integer | 아니오 | 페이지 크기 |

**응답**
```json
{
  "reports": [
    {
      "id": "uuid",
      "title": "학부모 폭언 사건",
      "status": "investigating",
      "urgency_level": 3,
      "incident_date": "2025-09-15",
      "location": "3학년 2반 교실",
      "assigned_lawyer": {
        "id": "uuid",
        "name": "김변호사"
      },
      "created_at": "2025-09-16T09:00:00.000Z"
    }
  ],
  "totalCount": 15,
  "statusCounts": {
    "submitted": 3,
    "investigating": 5,
    "consulting": 4,
    "resolved": 2,
    "closed": 1
  }
}
```

### 신고 작성

#### `POST /api/reports`
새 신고 접수

**요청**
```http
POST /api/reports
Authorization: Bearer jwt-token
Content-Type: application/json

{
  "title": "학생 폭언 신고",
  "content": "수업 중 학생이 교사에게 욕설을 했습니다.",
  "incident_date": "2025-09-21",
  "incident_location": "음악실",
  "witnesses": "다른 학생들 다수",
  "urgency_level": 2,
  "evidence_files": ["recording.mp3", "photo.jpg"]
}
```

### 특정 신고 조회

#### `GET /api/reports/{id}`
신고 상세 정보 조회

**요청**
```http
GET /api/reports/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer jwt-token
```

---

## 💼 변호사 상담 API

### 상담 요청 목록

#### `GET /api/consultations`
상담 요청 목록 조회

**요청**
```http
GET /api/consultations?status=pending&type=legal_review
```

### 상담 요청 생성

#### `POST /api/consultations`
새 상담 요청

**요청**
```http
POST /api/consultations
Authorization: Bearer jwt-token
Content-Type: application/json

{
  "title": "명예훼손 관련 상담",
  "content": "학부모가 SNS에 허위사실을 유포했습니다.",
  "consultation_type": "legal_review",
  "is_urgent": false,
  "related_report_id": "uuid"
}
```

---

## 📁 자료실 API

### 자료 목록 조회

#### `GET /api/resources`
자료실 파일 목록 조회

**요청**
```http
GET /api/resources?category=legal&page=1
```

**응답**
```json
{
  "resources": [
    {
      "id": "uuid",
      "title": "교권 보호 가이드라인",
      "description": "교사 권익 보호를 위한 종합 가이드",
      "category": "legal",
      "file_type": "pdf",
      "file_size": 2048576,
      "download_count": 245,
      "uploaded_by": {
        "name": "관리자"
      },
      "created_at": "2025-09-01T00:00:00.000Z"
    }
  ]
}
```

### 파일 업로드

#### `POST /api/resources/upload`
새 자료 업로드 (관리자만)

**요청**
```http
POST /api/resources/upload
Authorization: Bearer jwt-token
Content-Type: multipart/form-data

file: [binary data]
title: "새 자료"
description: "자료 설명"
category: "legal"
```

### 파일 다운로드

#### `GET /api/resources/{id}/download`
파일 다운로드

**요청**
```http
GET /api/resources/550e8400-e29b-41d4-a716-446655440000/download
Authorization: Bearer jwt-token
```

**응답**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="guide.pdf"

[binary file data]
```

---

## 🚫 오류 응답

### 표준 오류 형식
```json
{
  "error": "오류 메시지",
  "code": "ERROR_CODE",
  "details": {
    "field": "필드별 상세 오류"
  },
  "timestamp": "2025-09-22T04:30:00.000Z"
}
```

### 공통 HTTP 상태 코드

| 코드 | 설명 | 예시 |
|------|------|------|
| `200` | 성공 | 요청 처리 완료 |
| `201` | 생성됨 | 새 리소스 생성 |
| `400` | 잘못된 요청 | 필수 파라미터 누락 |
| `401` | 인증 필요 | 로그인 필요 |
| `403` | 접근 금지 | 권한 부족 |
| `404` | 찾을 수 없음 | 리소스 없음 |
| `409` | 충돌 | 중복 데이터 |
| `422` | 처리 불가 | 유효성 검증 실패 |
| `429` | 너무 많은 요청 | Rate Limit 초과 |
| `500` | 서버 오류 | 내부 서버 오류 |

## 🔢 Rate Limiting

### 제한 정책
- **일반 API**: 분당 100회
- **파일 업로드**: 분당 10회
- **인증 API**: 분당 20회

### Rate Limit 헤더
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 📝 Webhook

### 신고 상태 변경 알림
```http
POST https://your-domain.com/webhooks/report-status
Content-Type: application/json

{
  "event": "report.status_changed",
  "data": {
    "report_id": "uuid",
    "old_status": "investigating",
    "new_status": "resolved",
    "changed_by": "uuid",
    "timestamp": "2025-09-22T04:30:00.000Z"
  }
}
```

## 🛠️ SDK 및 도구

### JavaScript/TypeScript SDK
```bash
npm install @kyokwon119/api-client
```

```typescript
import { Kyokwon119Client } from '@kyokwon119/api-client';

const client = new Kyokwon119Client({
  apiKey: 'your-api-key',
  baseURL: 'https://api.kyokwon119.kr'
});

// 게시글 조회
const posts = await client.community.getPosts({
  category: 'experience',
  page: 1
});
```

### Postman Collection
```
import { baseURL }/api-docs/postman-collection.json
```

## 📊 API 상태 모니터링

### 상태 페이지
- **URL**: https://status.kyokwon119.kr
- **실시간 모니터링**: 모든 엔드포인트 응답 시간
- **장애 알림**: 자동 SMS/이메일 알림

### 메트릭 대시보드
- **평균 응답 시간**: < 200ms
- **가용성**: 99.9% 목표
- **오류율**: < 0.1% 목표

---

> **📘 참고**: 이 API 문서는 OpenAPI 3.0 스펙을 따릅니다. [Swagger UI](https://api.kyokwon119.kr/docs)에서 인터랙티브 문서를 확인할 수 있습니다.

**최종 업데이트**: 2025년 9월 22일
**API 버전**: v2.0.0