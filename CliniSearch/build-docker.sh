#!/bin/bash

# CliniSearch Docker Build Script
# This script builds and optionally runs the CliniSearch API Docker container

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="clinisearch-api"
CONTAINER_NAME="clinisearch-api"
PORT="8000"

echo -e "${BLUE}CliniSearch Docker Build Script${NC}"
echo "================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo "Please create a .env file with your API keys:"
    echo "  cp .env.example .env"
    echo "  # Edit .env with your actual API keys"
    echo ""
    read -p "Do you want to continue without .env file? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Parse command line arguments
BUILD_ONLY=false
RUN_CONTAINER=false
FORCE_REBUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --run)
            RUN_CONTAINER=true
            shift
            ;;
        --force)
            FORCE_REBUILD=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --build-only    Only build the Docker image, don't run"
            echo "  --run          Build and run the container"
            echo "  --force        Force rebuild without cache"
            echo "  --help         Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Build the Docker image
echo -e "${BLUE}Building Docker image: ${IMAGE_NAME}${NC}"

BUILD_ARGS=""
if [ "$FORCE_REBUILD" = true ]; then
    BUILD_ARGS="--no-cache"
fi

if docker build $BUILD_ARGS -t $IMAGE_NAME .; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build Docker image${NC}"
    exit 1
fi

# Stop and remove existing container if it exists
if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}Stopping existing container: ${CONTAINER_NAME}${NC}"
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true
fi

if [ "$BUILD_ONLY" = true ]; then
    echo -e "${GREEN}✓ Build completed. Use --run to start the container${NC}"
    exit 0
fi

# Run the container
echo -e "${BLUE}Starting container: ${CONTAINER_NAME}${NC}"

# Check if .env file exists for environment variables
ENV_FILE_ARGS=""
if [ -f ".env" ]; then
    ENV_FILE_ARGS="--env-file .env"
    echo -e "${GREEN}✓ Using .env file for environment variables${NC}"
fi

if docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:8000 \
    $ENV_FILE_ARGS \
    $IMAGE_NAME; then
    echo -e "${GREEN}✓ Container started successfully${NC}"
    echo ""
    echo "Container Information:"
    echo "  Name: $CONTAINER_NAME"
    echo "  Image: $IMAGE_NAME"
    echo "  Port: http://localhost:$PORT"
    echo "  API Docs: http://localhost:$PORT/docs"
    echo "  Health Check: http://localhost:$PORT/health"
    echo ""
    echo "Useful Commands:"
    echo "  View logs: docker logs $CONTAINER_NAME"
    echo "  Stop container: docker stop $CONTAINER_NAME"
    echo "  Remove container: docker rm $CONTAINER_NAME"
    echo "  Access shell: docker exec -it $CONTAINER_NAME /bin/bash"
else
    echo -e "${RED}✗ Failed to start container${NC}"
    exit 1
fi
