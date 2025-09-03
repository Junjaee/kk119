@echo off
echo ========================================
echo    포트 5000 사용 가능 여부 확인
echo ========================================
echo.

REM Check if port 5000 is in use
netstat -ano | findstr :5000 >nul
if %errorlevel% equ 0 (
    echo [경고] 포트 5000이 이미 사용중입니다!
    echo.
    echo 사용중인 프로세스:
    netstat -ano | findstr :5000
    echo.
    echo 해결 방법:
    echo 1. 위 PID를 가진 프로세스 종료
    echo    taskkill /PID [PID번호] /F
    echo.
    echo 2. 또는 docker-compose.yml에서 다른 포트로 변경
    echo.
    exit /b 1
) else (
    echo [확인] 포트 5000을 사용할 수 있습니다!
    echo.
    echo Docker 컨테이너를 시작하려면:
    echo   docker-compose up -d --build
    echo.
    echo 또는 start.bat을 실행하세요.
    echo.
)

pause