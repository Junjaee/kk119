# 🐳 Docker 배포 가이드

## 📋 사전 요구사항

- Docker Desktop 설치 ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose (Docker Desktop에 포함)

## 🚀 빠른 시작

### 1. Docker Compose 사용 (권장)

```bash
# 애플리케이션 시작
docker-compose up -d

# 브라우저에서 접속
http://localhost:3001
```

### 2. Docker 명령어 사용

#### Windows
```cmd
# 이미지 빌드
scripts\docker-build.bat

# 컨테이너 실행
scripts\docker-run.bat
```

#### Mac/Linux
```bash
# 이미지 빌드
./scripts/docker-build.sh

# 컨테이너 실행
./scripts/docker-run.sh
```

### 3. NPM 스크립트 사용

```bash
# Docker 이미지 빌드
npm run docker:build

# 컨테이너 시작
npm run docker:up

# 로그 확인
npm run docker:logs

# 컨테이너 중지
npm run docker:down
```

### 4. Make 명령어 사용 (Unix/Linux/Mac)

```bash
# 도움말 보기
make help

# 이미지 빌드
make build

# 컨테이너 실행
make run

# Docker Compose로 시작
make up

# 로그 확인
make logs

# 모든 것을 정리하고 재빌드
make rebuild
```

## 📦 Docker 이미지 정보

- **이미지 이름**: `kyokwon119:latest`
- **베이스 이미지**: `node:20-alpine`
- **빌드 방식**: Multi-stage build (최적화된 크기)
- **포트**: 3001

## 🔧 환경 변수 설정

### .env 파일 생성

```bash
# .env.example을 복사하여 .env 생성
cp .env.example .env
```

### 필수 환경 변수

```env
# 포트 설정
PORT=3001

# Supabase 설정 (선택사항)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# 앱 설정
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=교권119
```

## 🛠 컨테이너 관리

### 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너 확인
docker ps

# 모든 컨테이너 확인 (중지된 것 포함)
docker ps -a

# 컨테이너 상세 정보
docker inspect kyokwon119-app
```

### 로그 확인

```bash
# 실시간 로그
docker logs -f kyokwon119-app

# 최근 100줄만 보기
docker logs --tail 100 kyokwon119-app

# 타임스탬프 포함
docker logs -t kyokwon119-app
```

### 컨테이너 접속

```bash
# 컨테이너 내부 쉘 접속
docker exec -it kyokwon119-app /bin/sh

# 특정 명령 실행
docker exec kyokwon119-app ls -la
```

### 컨테이너 재시작

```bash
# 컨테이너 재시작
docker restart kyokwon119-app

# 컨테이너 중지
docker stop kyokwon119-app

# 컨테이너 시작
docker start kyokwon119-app
```

### 정리 작업

```bash
# 컨테이너 제거
docker rm kyokwon119-app

# 이미지 제거
docker rmi kyokwon119:latest

# 모든 것을 정리 (주의!)
docker-compose down -v
docker system prune -a
```

## 🔍 문제 해결

### 포트 충돌

포트 3001이 이미 사용 중인 경우:

1. docker-compose.yml에서 포트 변경
```yaml
ports:
  - "3002:3001"  # 3002로 변경
```

2. 환경 변수 업데이트
```env
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

### 빌드 실패

```bash
# 캐시 없이 재빌드
docker build --no-cache -t kyokwon119:latest .

# Docker 시스템 정리 후 재빌드
docker system prune -a
docker build -t kyokwon119:latest .
```

### 메모리 부족

Docker Desktop 설정에서 리소스 할당 증가:
- Settings → Resources → Advanced
- Memory: 최소 4GB 권장

## 🏭 프로덕션 배포

### 1. 환경 변수 설정

프로덕션용 `.env.production` 파일 생성:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
# 실제 Supabase 정보 입력
```

### 2. Docker 이미지 태그

```bash
# 버전 태그 사용
docker build -t kyokwon119:v1.0.0 .
docker tag kyokwon119:v1.0.0 kyokwon119:latest
```

### 3. Docker Registry 푸시

```bash
# Docker Hub 로그인
docker login

# 이미지 태그
docker tag kyokwon119:latest yourusername/kyokwon119:latest

# 푸시
docker push yourusername/kyokwon119:latest
```

### 4. 서버에서 실행

```bash
# 이미지 풀
docker pull yourusername/kyokwon119:latest

# 실행
docker run -d \
  --name kyokwon119-prod \
  -p 80:3001 \
  --env-file .env.production \
  --restart always \
  yourusername/kyokwon119:latest
```

## 📊 모니터링

### 리소스 사용량 확인

```bash
# CPU/메모리 사용량
docker stats kyokwon119-app

# 디스크 사용량
docker system df
```

### 헬스체크

```bash
# 헬스체크 상태 확인
docker inspect --format='{{json .State.Health}}' kyokwon119-app

# API 헬스체크 엔드포인트 테스트
curl http://localhost:3001/api/health
```

## 🔐 보안 고려사항

1. **비밀 정보 관리**
   - 환경 변수에 민감한 정보 저장
   - `.env` 파일을 절대 커밋하지 않기

2. **네트워크 보안**
   - 필요한 포트만 노출
   - 프로덕션에서는 리버스 프록시 사용 권장

3. **이미지 보안**
   - 정기적으로 베이스 이미지 업데이트
   - 불필요한 패키지 제거
   - Non-root 사용자로 실행

## 📚 추가 자료

- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [Next.js Docker 배포 가이드](https://nextjs.org/docs/deployment#docker-image)

---

문제가 발생하면 이슈를 생성해주세요!