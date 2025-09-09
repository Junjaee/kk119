# 교권119 Docker 실행 가이드 (Port 5000)

## 🚀 빠른 시작

포트 5000으로 설정이 완료되었습니다. 아래 명령어로 Docker 컨테이너를 실행하세요.

### 방법 1: Docker Compose 사용 (권장)

```bash
# 기존 컨테이너 중지 및 제거
docker-compose down

# 새로 빌드 및 실행
docker-compose up -d --build

# 브라우저에서 접속
http://localhost:5000
```

### 방법 2: Windows 스크립트 사용

```batch
# 1. Docker 이미지 빌드
scripts\docker-build.bat

# 2. Docker 컨테이너 실행
scripts\docker-run.bat

# 브라우저에서 접속
http://localhost:5000
```

### 방법 3: 수동 Docker 명령어

```bash
# 기존 컨테이너 중지 및 제거
docker stop kyokwon119-app
docker rm kyokwon119-app

# Docker 이미지 빌드
docker build -t kyokwon119:latest .

# Docker 컨테이너 실행
docker run -d \
  --name kyokwon119-app \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e NEXT_PUBLIC_APP_URL=http://localhost:5000 \
  --restart unless-stopped \
  kyokwon119:latest
```

## 🔍 컨테이너 상태 확인

```bash
# 컨테이너 상태 확인
docker ps

# 로그 확인
docker logs kyokwon119-app

# 실시간 로그 확인
docker logs -f kyokwon119-app
```

## 🛠 문제 해결

### 포트 5000이 이미 사용중인 경우

Windows에서 포트 사용 확인:
```cmd
netstat -ano | findstr :5000
```

Mac/Linux에서 포트 사용 확인:
```bash
lsof -i :5000
```

### Docker 컨테이너가 시작되지 않는 경우

1. Docker Desktop이 실행중인지 확인
2. 기존 컨테이너 완전히 제거:
   ```bash
   docker stop kyokwon119-app
   docker rm kyokwon119-app
   docker rmi kyokwon119:latest
   ```
3. 다시 빌드 및 실행:
   ```bash
   docker-compose up -d --build
   ```

### 접속이 안되는 경우

1. 컨테이너 실행 확인:
   ```bash
   docker ps | grep kyokwon119
   ```

2. 컨테이너 로그 확인:
   ```bash
   docker logs kyokwon119-app
   ```

3. 방화벽 설정 확인 (Windows):
   - Windows 방화벽에서 Docker Desktop 허용
   - 포트 5000 인바운드 규칙 추가

4. Docker 네트워크 확인:
   ```bash
   docker inspect kyokwon119-app | grep IPAddress
   ```

## ✅ 정상 작동 확인

브라우저에서 `http://localhost:5000` 접속하여:
1. 교권119 메인 페이지가 표시되는지 확인
2. 자동으로 익명교사1234로 로그인되는지 확인
3. 각 메뉴가 정상적으로 작동하는지 확인

## 📝 변경된 파일 목록

- `docker-compose.yml`: 포트 5000으로 변경
- `Dockerfile`: EXPOSE 5000으로 변경
- `scripts/docker-run.bat`: 포트 5000으로 변경
- `scripts/docker-run.sh`: 포트 5000으로 변경
- `start.bat`: 포트 5000으로 변경
- `start.sh`: 포트 5000으로 변경
- `README.md`: 포트 5000으로 문서 업데이트