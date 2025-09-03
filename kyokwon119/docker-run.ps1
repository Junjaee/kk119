# 교권119 Docker 실행 스크립트 (PowerShell)
# Windows에서 Docker를 쉽게 실행할 수 있는 스크립트

param(
    [Parameter()]
    [ValidateSet("prod", "dev", "stop", "logs", "clean", "status")]
    [string]$Mode = "prod"
)

$ErrorActionPreference = "Stop"

Write-Host "교권119 Docker Manager" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

function Test-Docker {
    try {
        docker version | Out-Null
        return $true
    }
    catch {
        Write-Host "Docker가 설치되어 있지 않거나 실행되지 않습니다." -ForegroundColor Red
        Write-Host "Docker Desktop을 설치하고 실행한 후 다시 시도하세요." -ForegroundColor Yellow
        return $false
    }
}

function Start-Production {
    Write-Host "프로덕션 모드 시작 중..." -ForegroundColor Green
    
    # 이전 컨테이너 정지 및 제거
    docker stop kyokwon119-app 2>$null
    docker rm kyokwon119-app 2>$null
    
    # 이미지 빌드
    Write-Host "Docker 이미지 빌드 중..." -ForegroundColor Yellow
    docker build -t kyokwon119:latest .
    
    # docker-compose로 실행
    Write-Host "애플리케이션 시작 중..." -ForegroundColor Yellow
    docker-compose up -d
    
    Write-Host "`n✅ 교권119가 성공적으로 시작되었습니다!" -ForegroundColor Green
    Write-Host "🌐 접속 주소: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "📝 로그 확인: docker-compose logs -f kyokwon119" -ForegroundColor Gray
}

function Start-Development {
    Write-Host "개발 모드 시작 중..." -ForegroundColor Green
    
    # docker-compose dev로 실행
    Write-Host "개발 서버 시작 중..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml up -d --build
    
    Write-Host "`n✅ 개발 서버가 성공적으로 시작되었습니다!" -ForegroundColor Green
    Write-Host "🌐 접속 주소: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "📝 로그 확인: docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor Gray
    Write-Host "🔥 Hot Reload가 활성화되어 있습니다." -ForegroundColor Yellow
}

function Stop-Containers {
    Write-Host "컨테이너 중지 중..." -ForegroundColor Yellow
    
    docker-compose down
    docker-compose -f docker-compose.dev.yml down 2>$null
    
    Write-Host "✅ 모든 컨테이너가 중지되었습니다." -ForegroundColor Green
}

function Show-Logs {
    Write-Host "로그를 표시합니다. (Ctrl+C로 종료)" -ForegroundColor Yellow
    docker-compose logs -f kyokwon119
}

function Clean-All {
    Write-Host "모든 컨테이너와 이미지를 정리합니다..." -ForegroundColor Yellow
    
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v 2>$null
    docker rmi kyokwon119:latest 2>$null
    docker rmi kyokwon119-dev:latest 2>$null
    
    Write-Host "✅ 정리가 완료되었습니다." -ForegroundColor Green
}

function Show-Status {
    Write-Host "교권119 컨테이너 상태:" -ForegroundColor Cyan
    docker ps -a | Select-String "kyokwon119"
    
    Write-Host "`n네트워크 상태:" -ForegroundColor Cyan
    docker network ls | Select-String "kyokwon119"
    
    Write-Host "`n볼륨 상태:" -ForegroundColor Cyan
    docker volume ls | Select-String "kyokwon119"
}

# Docker 확인
if (-not (Test-Docker)) {
    exit 1
}

# 모드에 따라 실행
switch ($Mode) {
    "prod" { Start-Production }
    "dev" { Start-Development }
    "stop" { Stop-Containers }
    "logs" { Show-Logs }
    "clean" { Clean-All }
    "status" { Show-Status }
}

Write-Host "`n작업이 완료되었습니다." -ForegroundColor Green