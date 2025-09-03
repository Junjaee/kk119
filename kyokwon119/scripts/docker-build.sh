#!/bin/bash

echo "🚀 Building 교권119 Docker image..."

# Build the Docker image
docker build -t kyokwon119:latest .

echo "✅ Docker image built successfully!"
echo "📌 Image name: kyokwon119:latest"
echo ""
echo "To run the container, use:"
echo "  ./scripts/docker-run.sh"
echo "or"
echo "  docker-compose up"