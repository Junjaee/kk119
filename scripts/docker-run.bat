@echo off
echo Starting 교권119 Docker container...
echo.

REM Stop and remove existing container if it exists
docker stop kyokwon119-app 2>nul
docker rm kyokwon119-app 2>nul

REM Run the Docker container
docker run -d ^
  --name kyokwon119-app ^
  -p 5000:5000 ^
  -e NODE_ENV=production ^
  -e PORT=5000 ^
  -e NEXT_PUBLIC_APP_URL=http://localhost:5000 ^
  --restart unless-stopped ^
  kyokwon119:latest

echo.
echo Container started successfully!
echo Application is running at: http://localhost:5000
echo.
echo To view logs:
echo   docker logs -f kyokwon119-app
echo.
echo To stop the container:
echo   docker stop kyokwon119-app
echo.