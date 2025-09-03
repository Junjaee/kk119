# 🚀 교권119 빠른 시작 가이드

## 1분 안에 시작하기!

### Windows 사용자

1. **Docker Desktop 설치** ([다운로드](https://www.docker.com/products/docker-desktop))

2. **Docker Desktop 실행**

3. **교권119 시작**
   ```cmd
   start.bat
   ```
   또는 더블클릭으로 `start.bat` 실행

4. **브라우저에서 접속**
   ```
   http://localhost:3001
   ```

### Mac/Linux 사용자

1. **Docker Desktop 설치** ([다운로드](https://www.docker.com/products/docker-desktop))

2. **Docker Desktop 실행**

3. **실행 권한 부여 및 시작**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

4. **브라우저에서 접속**
   ```
   http://localhost:3001
   ```

## ✨ 그게 전부입니다!

시스템이 자동으로:
- Docker 이미지를 빌드합니다
- 컨테이너를 시작합니다
- 포트 3001에서 서비스를 시작합니다

## 🔐 테스트 계정

자동으로 로그인되며, 역할 전환 시:
- **교사 모드**: 메인 페이지 (/)
- **변호사 모드**: /lawyer 페이지 방문
- **관리자 모드**: /admin 페이지 방문

## ⚡ 주요 기능

- 📝 **신고 작성**: 교권 침해 신고
- 👥 **커뮤니티**: 교사들과 소통
- ⚖️ **법률 상담**: 변호사 답변
- 📊 **대시보드**: 통계 및 현황

## 🛑 종료 방법

```bash
docker-compose down
```

## ❓ 문제 해결

### Docker가 실행되지 않음
→ Docker Desktop을 먼저 실행하세요

### 포트 3001이 사용 중
→ 다른 프로그램이 포트를 사용 중입니다. 해당 프로그램을 종료하세요.

### 빌드 실패
→ 인터넷 연결을 확인하고 다시 시도하세요

## 📚 더 자세한 정보

- [전체 설명서](README.md)
- [Docker 가이드](DOCKER.md)
- [프로젝트 문서](documents/)