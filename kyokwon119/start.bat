@echo off
echo ========================================
echo    교권119 시스템 시작
echo    Starting Kyokwon119 System
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker가 설치되어 있지 않습니다!
    echo Docker Desktop을 먼저 설치해주세요.
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker가 실행중이 아닙니다!
    echo Docker Desktop을 먼저 실행해주세요.
    echo.
    pause
    exit /b 1
)

echo Docker를 확인했습니다. 시스템을 시작합니다...
echo.

REM Start using docker-compose
echo Docker Compose로 애플리케이션을 시작합니다...
docker-compose up -d

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    시작 완료!
    echo    브라우저에서 다음 주소로 접속하세요:
    echo    http://localhost:5000
    echo ========================================
    echo.
    echo 종료하려면:
    echo   docker-compose down
    echo.
    echo 로그를 보려면:
    echo   docker logs -f kyokwon119-app
    echo.
) else (
    echo.
    echo 시작 실패! 다음을 확인해주세요:
    echo 1. Docker Desktop이 실행중인지
    echo 2. 포트 5000이 사용중이지 않은지
    echo.
)

pause