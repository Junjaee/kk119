@echo off
echo Building 교권119 Docker image...
echo.

REM Build the Docker image
docker build -t kyokwon119:latest .

echo.
echo Docker image built successfully!
echo Image name: kyokwon119:latest
echo.
echo To run the container, use:
echo   scripts\docker-run.bat
echo or
echo   docker-compose up
echo.