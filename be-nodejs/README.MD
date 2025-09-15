# Exe202 - FreelanceIT

## I. Init project
1. Install dependencies of project `npm i`
2. Install mongodb and redis for docker container   
`cd ./.devcontainer`  
`docker-compose up -d`  

## II. API Documentation

### Swagger UI
The API documentation is available through Swagger UI at:
- **URL**: `http://localhost:5000/api-docs`
- **Description**: Interactive API documentation with the ability to test endpoints directly

### Available Endpoints

#### Authentication Endpoints
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Authenticate user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile (requires authentication)

#### System Endpoints
- `GET /api/v1/health` - Health check endpoint

### Authentication
Protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-access-token>
```

## III. Development

### Running the Application
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

### Environment Variables
Make sure to set up your `.env` file with the following variables:
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_ACCESS_TOKEN_EXPIRATION` - Access token expiration time
- `JWT_REFRESH_TOKEN_EXPIRATION` - Refresh token expiration time
