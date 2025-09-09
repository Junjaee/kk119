# 교권119 Docker 가이드

## 🚀 빠른 시작

### Windows (PowerShell)
```powershell
# 프로덕션 모드 실행 (포트 5000)
.\docker-run.ps1 -Mode prod

# 개발 모드 실행 (포트 3000, Hot Reload)
.\docker-run.ps1 -Mode dev

# 컨테이너 중지
.\docker-run.ps1 -Mode stop

# 로그 확인
.\docker-run.ps1 -Mode logs

# 상태 확인
.\docker-run.ps1 -Mode status

# 전체 정리
.\docker-run.ps1 -Mode clean
```

### Linux/Mac (Make)
```bash
# 프로덕션 모드 실행 (포트 5000)
make prod

# 개발 모드 실행 (포트 3000, Hot Reload)
make dev

# 컨테이너 중지
make down

# 로그 확인
make logs

# 상태 확인
make status

# 전체 정리
make clean
```

## 📋 상세 명령어

### Docker Compose 직접 사용

#### 프로덕션 모드
```bash
# 빌드 및 실행
docker-compose up -d --build

# 중지
docker-compose down

# 로그 확인
docker-compose logs -f kyokwon119

# 컨테이너 접속
docker exec -it kyokwon119-app sh
```

#### 개발 모드
```bash
# 빌드 및 실행
docker-compose -f docker-compose.dev.yml up -d --build

# 중지
docker-compose -f docker-compose.dev.yml down

# 로그 확인
docker-compose -f docker-compose.dev.yml logs -f

# 컨테이너 접속
docker exec -it kyokwon119-dev sh
```

## 🔧 환경 설정

### 환경 변수 설정
1. `.env.example` 파일을 `.env.local`로 복사
2. 필요한 환경 변수 값 설정

```bash
cp .env.example .env.local
```

### 주요 환경 변수
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키
- `PORT`: 애플리케이션 포트 (기본: 5000)

## 📁 파일 구조

```
kyokwon119/
├── Dockerfile              # 프로덕션 빌드 파일
├── Dockerfile.dev         # 개발 모드 빌드 파일
├── docker-compose.yml     # 프로덕션 설정
├── docker-compose.dev.yml # 개발 모드 설정
├── .dockerignore         # Docker 빌드 제외 파일
├── .env.example          # 환경 변수 예제
├── Makefile             # Make 명령어
└── docker-run.ps1       # Windows PowerShell 스크립트
```

## 🌐 접속 주소

- **프로덕션**: http://localhost:5000
- **개발 모드**: http://localhost:3000
- **헬스체크**: http://localhost:5000/api/health

## 🔍 문제 해결

### Docker Desktop이 실행되지 않음
```powershell
# Windows에서 Docker Desktop 시작
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

### 포트가 이미 사용 중
```bash
# 사용 중인 포트 확인 (Windows)
netstat -ano | findstr :5000

# 사용 중인 포트 확인 (Linux/Mac)
lsof -i :5000

# 프로세스 종료
# Windows: taskkill /PID [process_id] /F
# Linux/Mac: kill -9 [process_id]
```

### 권한 문제
```bash
# Linux/Mac에서 sudo 사용
sudo docker-compose up -d

# Windows에서 관리자 권한으로 PowerShell 실행
```

### 빌드 캐시 문제
```bash
# 캐시 없이 재빌드
docker-compose build --no-cache

# 또는
docker build --no-cache -t kyokwon119:latest .
```

## 📊 리소스 사용량

### 프로덕션 모드
- CPU: 최대 1 core
- 메모리: 최대 512MB
- 예약: CPU 0.5 core, 메모리 256MB

### 개발 모드
- CPU: 제한 없음
- 메모리: 제한 없음
- 볼륨 마운트로 Hot Reload 지원

## 🔄 업데이트

### 코드 변경 후 재배포
```bash
# 프로덕션
make rebuild

# 또는
docker-compose up -d --build
```

### 이미지 업데이트
```bash
# 최신 이미지로 업데이트
docker pull node:20-alpine
docker-compose build --pull
```

## 📝 로그 관리

로그는 자동으로 관리되며 다음과 같이 설정됩니다:
- 최대 파일 크기: 10MB
- 최대 파일 개수: 3개
- 로그 드라이버: json-file

## 🔐 보안

- 비-root 사용자(nextjs)로 실행
- 보안 헤더 자동 설정
- 환경 변수를 통한 민감 정보 관리
- 최소 권한 원칙 적용

## 💡 팁

1. **개발 모드**에서는 코드 변경이 자동으로 반영됩니다
2. **프로덕션 모드**는 최적화된 빌드로 더 빠른 성능을 제공합니다
3. `make help` 또는 `.\docker-run.ps1 -?`로 사용 가능한 명령어를 확인할 수 있습니다
4. 로그는 실시간으로 확인하는 것이 디버깅에 유용합니다

## 🆘 지원

문제가 발생하면 다음을 확인하세요:
1. Docker Desktop이 실행 중인지 확인
2. 포트가 사용 가능한지 확인
3. 환경 변수가 올바르게 설정되었는지 확인
4. 로그를 확인하여 에러 메시지 파악