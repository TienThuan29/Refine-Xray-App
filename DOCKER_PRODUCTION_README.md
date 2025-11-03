# Docker Production Deployment Guide

This guide explains how to build and deploy all services using Docker Compose for production.

## Prerequisites

- Docker Engine 20.10 or later
- Docker Compose v2.0 or later
- Environment variables configured (see below)

## Architecture

The production setup includes:

### Microservices (.NET 9.0)
- **API Gateway** (Port 8080) - Routes requests to backend services
- **Identity Service** (Port 8082) - Authentication and user management
- **Patient Service** (Port 8085) - Patient profile management
- **Doctor Service** (Port 8083) - Doctor workflows, chat sessions, folders
- **Admin Service** (Port 8086) - Report template management

### Python Services
- **RAG-Pubmed** (Port 8001) - Medical RAG API using FastAPI

### External Services
- **CliniSearch** (Port 8000) - AI service (external Docker image)
- **Redis** (Port 6379) - Caching layer

### Web Application
- **Web App** (Port 3000) - Next.js frontend application

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# AWS Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY=your-aws-access-key
AWS_SECRET_KEY=your-aws-secret-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_ACCESS_TOKEN_EXPIRATION=1d
JWT_REFRESH_TOKEN_EXPIRATION=7d
BCRYPT_SALT_ROUNDS=12

# System Secrets
SYSTEM_SECRET=your-system-secret
HASHING_SECRET_KEY=your-hashing-secret-key

# DynamoDB Tables (optional, defaults provided)
DYNAMODB_USER_TABLE=prm392-users
DYNAMODB_PATIENT_PROFILE_TABLE=prm392-patient-profiles
DYNAMODB_FOLDER_TABLE=prm392-folders
DYNAMODB_CHAT_SESSION_TABLE=prm392-chatsessions
DYNAMODB_REPORT_TABLE=prm392-reports
DYNAMODB_REPORT_TEMPLATE_TABLE=prm392-report-templates

# S3 Configuration
S3_BUCKET_NAME=prm392-storage

# Service URLs (for internal communication)
CLINIAI_BASE_URL=http://clinisearch:8000
PUBMEDRAG_BASE_URL=http://rag-pubmed:8001

# External API Keys
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_API_KEY=your-google-api-key
NCBI_EMAIL=your-ncbi-email
ANTHROPIC_API_KEY=your-anthropic-api-key
GEMINI_MODEL_NAME=gemini-2.5-flash

# Next.js Public Variables
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_HASHING_SECRET_KEY=your-hashing-secret-key
NEXT_PUBLIC_XRAY_DETECTION_API=your-xray-detection-api-url

# Port Overrides (optional)
API_GATEWAY_PORT=8080
IDENTITY_SERVICE_PORT=8082
DOCTOR_SERVICE_PORT=8083
PATIENT_SERVICE_PORT=8085
ADMIN_SERVICE_PORT=8086
RAG_PUBMED_PORT=8001
CLINISEARCH_PORT=8000
WEB_APP_PORT=3000
REDIS_PORT=6379
```

## Building and Starting Services

### Build all services
```bash
docker-compose -f docker-compose-production.yml build
```

### Start all services
```bash
docker-compose -f docker-compose-production.yml up -d
```

### View logs
```bash
# All services
docker-compose -f docker-compose-production.yml logs -f

# Specific service
docker-compose -f docker-compose-production.yml logs -f api-gateway
```

### Stop all services
```bash
docker-compose -f docker-compose-production.yml down
```

### Stop and remove volumes
```bash
docker-compose -f docker-compose-production.yml down -v
```

## Individual Service Management

### Build a specific service
```bash
docker-compose -f docker-compose-production.yml build api-gateway
```

### Restart a specific service
```bash
docker-compose -f docker-compose-production.yml restart api-gateway
```

### Scale a service
```bash
docker-compose -f docker-compose-production.yml up -d --scale doctor-service=3
```

## Health Checks

All services include health checks. Check service health:

```bash
# Check all services health
docker-compose -f docker-compose-production.yml ps

# Test health endpoint manually
curl http://localhost:8080/health  # API Gateway
curl http://localhost:8082/health  # Identity Service
curl http://localhost:8083/health  # Doctor Service
curl http://localhost:8085/health  # Patient Service
curl http://localhost:8086/health  # Admin Service
curl http://localhost:8001/health  # RAG-Pubmed
```

## Service Dependencies

The services start in the following order:
1. Redis
2. Identity Service
3. Patient Service, RAG-Pubmed, CliniSearch (in parallel)
4. Doctor Service (depends on Identity, CliniSearch, RAG-Pubmed)
5. Admin Service (depends on Identity)
6. API Gateway (depends on all microservices)
7. Web App (depends on API Gateway)

## Network

All services are connected to the `prm392-network` bridge network. Services communicate using Docker service names:
- `identity-service:8082`
- `patient-service:8085`
- `doctor-service:8083`
- `admin-service:8086`
- `rag-pubmed:8001`
- `clinisearch:8000`

## API Gateway Configuration

The API Gateway uses different Ocelot configuration files based on environment:
- Development: `ocelot.json` (uses `localhost`)
- Production: `ocelot.Production.json` (uses Docker service names)

## Troubleshooting

### Service won't start
1. Check logs: `docker-compose -f docker-compose-production.yml logs <service-name>`
2. Verify environment variables are set correctly
3. Check if ports are already in use
4. Verify AWS credentials are correct

### Health check failures
1. Wait for the service startup period (30-60 seconds)
2. Check service logs for errors
3. Verify all dependencies are running

### Build failures
1. Ensure Docker has enough resources allocated
2. Check for network connectivity issues
3. Verify .NET SDK and runtime versions are compatible

## Production Considerations

1. **Security**: Never commit `.env` files with real credentials
2. **Secrets Management**: Consider using Docker secrets or external secret managers
3. **Monitoring**: Add monitoring and logging solutions (e.g., Prometheus, Grafana)
4. **Load Balancing**: Use a reverse proxy (nginx/traefik) in front of the API Gateway
5. **SSL/TLS**: Configure HTTPS termination at the reverse proxy level
6. **Database**: Ensure AWS DynamoDB tables are properly configured
7. **Storage**: Verify S3 bucket permissions and configuration
8. **Backups**: Set up automated backups for Redis data

## Volumes

The following volumes are created:
- `redis_data`: Redis persistent data
- `model_cache`: CliniSearch model cache

## Ports Exposed

Make sure these ports are available:
- 3000: Web Application
- 6379: Redis
- 8000: CliniSearch AI Service
- 8001: RAG-Pubmed Service
- 8080: API Gateway
- 8082: Identity Service
- 8083: Doctor Service
- 8085: Patient Service
- 8086: Admin Service

