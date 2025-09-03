.PHONY: help build run up down logs shell clean rebuild dev dev-stop dev-logs prod status

# Default target
help:
	@echo "교권119 Docker Management Commands"
	@echo ""
	@echo "Production commands:"
	@echo "  make build    - Build Docker image"
	@echo "  make run      - Run Docker container on port 5000"
	@echo "  make up       - Start services using docker-compose"
	@echo "  make down     - Stop services using docker-compose"
	@echo "  make logs     - View container logs"
	@echo "  make shell    - Access container shell"
	@echo "  make clean    - Remove container and image"
	@echo "  make rebuild  - Clean and rebuild everything"
	@echo "  make prod     - Build and run production"
	@echo "  make status   - Check container status"
	@echo ""
	@echo "Development commands:"
	@echo "  make dev      - Start development mode (port 3000)"
	@echo "  make dev-stop - Stop development mode"
	@echo "  make dev-logs - View development logs"

# Build Docker image
build:
	docker build -t kyokwon119:latest .

# Run Docker container
run:
	docker stop kyokwon119-app 2>/dev/null || true
	docker rm kyokwon119-app 2>/dev/null || true
	docker run -d \
		--name kyokwon119-app \
		-p 5000:5000 \
		-e NODE_ENV=production \
		-e PORT=5000 \
		--restart unless-stopped \
		kyokwon119:latest
	@echo "Application is running at http://localhost:5000"

# Docker Compose commands
up:
	docker-compose up -d
	@echo "Application is running at http://localhost:5000"

down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f kyokwon119

# Access container shell
shell:
	docker exec -it kyokwon119-app sh

# Clean up
clean:
	docker stop kyokwon119-app 2>/dev/null || true
	docker rm kyokwon119-app 2>/dev/null || true
	docker rmi kyokwon119:latest 2>/dev/null || true
	docker-compose down -v 2>/dev/null || true
	docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true

# Rebuild everything
rebuild: clean build run

# Development mode
dev:
	docker-compose -f docker-compose.dev.yml up -d --build
	@echo "Development server is running at http://localhost:3000"

# Stop development mode
dev-stop:
	docker-compose -f docker-compose.dev.yml down

# Development logs
dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

# Production build and run
prod: build up

# Check status
status:
	@docker ps -a | grep kyokwon119 || echo "No kyokwon119 containers found"