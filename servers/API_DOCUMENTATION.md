# RefineXray App - API Documentation

This document provides a complete list of all APIs available in the RefineXray backend services for testing in Postman.

## Base URLs

### Direct Service Access
- **IdentityService**: `http://localhost:8082`
- **DoctorService**: `http://localhost:8083`
- **PatientService**: `http://localhost:8085`
- **AdminService**: `http://localhost:8086`
- **ApiGateway**: `http://localhost:8080`
- **RAG-Pubmed Service**: `http://localhost:8001` (FastAPI)

### API Gateway Routes
- **Auth APIs**: `http://localhost:8080/api/auth`
- **Doctor APIs**: `http://localhost:8080/api/doctors`
- **Patient APIs**: `http://localhost:8080/api/patients`
- **Admin APIs**: `http://localhost:8080/api/admin`

---

## Authentication

Most APIs require JWT authentication. Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 1. Identity Service (Auth) APIs

**Base URL**: `http://localhost:8082/api/v1`  
**Gateway URL**: `http://localhost:8080/api/auth/v1`

### 1.1 Login
- **Method**: `POST`
- **Endpoint**: `/login`
- **Auth**: None
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userProfile": {
      "id": "string",
      "email": "string",
      "fullname": "string",
      "phone": "string",
      "dateOfBirth": "2024-01-01T00:00:00Z",
      "role": "PATIENT|DOCTOR|ADMIN",
      "isEnable": true,
      "lastLoginDate": "2024-01-01T00:00:00Z",
      "createdDate": "2024-01-01T00:00:00Z",
      "updatedDate": "2024-01-01T00:00:00Z"
    },
    "accessToken": "string",
    "refreshToken": "string"
  },
  "statusCode": 200
}
```

### 1.2 Register Patient
- **Method**: `POST`
- **Endpoint**: `/register/patient`
- **Auth**: None
- **Request Body**:
```json
{
  "email": "patient@example.com",
  "fullname": "John Doe",
  "password": "password123",
  "role": "PATIENT"
}
```
- **Response**: Same as Login

### 1.3 Refresh Token
- **Method**: `POST`
- **Endpoint**: `/refresh`
- **Auth**: None
- **Request Body**:
```json
{
  "refreshToken": "string"
}
```
- **Response**: Same as Login

### 1.4 Get Profile
- **Method**: `GET`
- **Endpoint**: `/profile`
- **Auth**: Required (Bearer Token)
- **Request Body**: None
- **Response**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "string",
    "email": "string",
    "fullname": "string",
    "phone": "string",
    "dateOfBirth": "2024-01-01T00:00:00Z",
    "role": "string",
    "isEnable": true,
    "lastLoginDate": "2024-01-01T00:00:00Z",
    "createdDate": "2024-01-01T00:00:00Z",
    "updatedDate": "2024-01-01T00:00:00Z"
  },
  "statusCode": 200
}
```

### 1.5 Get All Users (Admin Only)
- **Method**: `GET`
- **Endpoint**: `/users`
- **Auth**: Required (Admin role)
- **Request Body**: None
- **Response**:
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "string",
      "email": "string",
      "fullname": "string",
      "phone": "string",
      "dateOfBirth": "2024-01-01T00:00:00Z",
      "role": "string",
      "isEnable": true,
      "lastLoginDate": "2024-01-01T00:00:00Z",
      "createdDate": "2024-01-01T00:00:00Z",
      "updatedDate": "2024-01-01T00:00:00Z"
    }
  ],
  "statusCode": 200
}
```

### 1.6 Get User By Email
- **Method**: `POST`
- **Endpoint**: `/users/by-email`
- **Auth**: Required
- **Request Body**:
```json
{
  "email": "user@example.com"
}
```
- **Response**: Same as Get Profile

### 1.7 Get User By Email (Internal)
- **Method**: `POST`
- **Endpoint**: `/internal/users/by-email`
- **Auth**: System Secret (for service-to-service calls)
- **Request Body**:
```json
{
  "email": "user@example.com"
}
```
- **Response**: Same as Get Profile

### 1.8 Get User By ID (Internal)
- **Method**: `POST`
- **Endpoint**: `/internal/users/by-id`
- **Auth**: System Secret (for service-to-service calls)
- **Request Body**:
```json
{
  "id": "user-id-123"
}
```
- **Response**: Same as Get Profile

### 1.9 Update User (Admin Only)
- **Method**: `PUT`
- **Endpoint**: `/users`
- **Auth**: Required (Admin role)
- **Request Body**:
```json
{
  "email": "user@example.com",
  "fullname": "Updated Name",
  "phone": "1234567890",
  "dateOfBirth": "1990-01-01T00:00:00Z",
  "role": "PATIENT",
  "isEnable": true,
  "password": "newpassword"
}
```
- **Response**: Same as Get Profile

### 1.10 Delete User (Admin Only)
- **Method**: `DELETE`
- **Endpoint**: `/users`
- **Auth**: Required (Admin role)
- **Request Body**:
```json
{
  "email": "user@example.com"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "deleted": true
  },
  "statusCode": 200
}
```

### 1.11 Update User Status (Admin Only)
- **Method**: `PUT`
- **Endpoint**: `/users/status`
- **Auth**: Required (Admin role)
- **Request Body**:
```json
{
  "email": "user@example.com",
  "isEnable": false
}
```
- **Response**: Same as Get Profile

### 1.12 Health Check
- **Method**: `GET`
- **Endpoint**: `/api/health`
- **Auth**: None
- **Response**:
```json
{
  "message": "IdentityService is running",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 2. Patient Service APIs

**Base URL**: `http://localhost:8085/api/v1`  
**Gateway URL**: `http://localhost:8080/api/patients/v1`

### 2.1 Patient Profile APIs

#### 2.1.1 Get All Patient Profiles
- **Method**: `GET`
- **Endpoint**: `/patient-profiles`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "fullname": "string",
      "gender": "MALE|FEMALE|OTHER",
      "phone": "string",
      "houseNumber": "string",
      "commune": {
        "id": "string",
        "name": "string"
      },
      "province": {
        "id": "string",
        "name": "string"
      },
      "nation": "string"
    }
  ]
}
```

#### 2.1.2 Get Patient Profile By ID
- **Method**: `GET`
- **Endpoint**: `/patient-profiles/{id}`
- **Auth**: Required
- **Response**: Same as above (single object)

#### 2.1.3 Create Patient Profile
- **Method**: `POST`
- **Endpoint**: `/patient-profiles?folderId={folderId}`
- **Auth**: Required
- **Query Params**: `folderId` (required)
- **Request Body**:
```json
{
  "fullname": "John Doe",
  "gender": "MALE",
  "phone": "1234567890",
  "houseNumber": "123",
  "commune": {
    "id": "commune-id",
    "name": "Commune Name"
  },
  "province": {
    "id": "province-id",
    "name": "Province Name"
  },
  "nation": "Vietnam"
}
```
- **Response**: Same as Get Patient Profile

#### 2.1.4 Update Patient Profile
- **Method**: `PUT`
- **Endpoint**: `/patient-profiles/{id}`
- **Auth**: Required
- **Request Body**: Same as Create
- **Response**: Same as Get Patient Profile

#### 2.1.5 Delete Patient Profile
- **Method**: `DELETE`
- **Endpoint**: `/patient-profiles/{id}`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "message": "Patient profile deleted",
  "data": {}
}
```

### 2.2 Patient Report APIs

#### 2.2.1 Create Patient Report
- **Method**: `POST`
- **Endpoint**: `/patient-reports`
- **Auth**: Required
- **Request Body**:
```json
{
  "title": "Report Title",
  "content": "Report Content",
  "patient_email": "patient@example.com",
  "is_sent": false,
  "sent_date": "2024-01-01T00:00:00Z",
  "sent_by_id": "doctor-id",
  "sent_by_fullname": "Dr. Smith"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Patient report created",
  "data": {
    "id": "string",
    "title": "string",
    "content": "string",
    "patient_email": "string",
    "is_sent": false,
    "sent_date": "2024-01-01T00:00:00Z",
    "is_read": false,
    "sent_by_id": "string",
    "sent_by_fullname": "string"
  },
  "statusCode": 201
}
```

#### 2.2.2 Get Reports By Patient Email
- **Method**: `GET`
- **Endpoint**: `/patient-reports/patient/{email}`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "patient_email": "string",
      "is_sent": false,
      "sent_date": "2024-01-01T00:00:00Z",
      "is_read": false,
      "sent_by_id": "string",
      "sent_by_fullname": "string"
    }
  ]
}
```

#### 2.2.3 Mark Report As Read
- **Method**: `PUT`
- **Endpoint**: `/patient-reports/{id}/mark-read`
- **Auth**: Required
- **Response**: Same as Create Patient Report

#### 2.2.4 Delete Patient Report
- **Method**: `DELETE`
- **Endpoint**: `/patient-reports/{id}`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "message": "Patient report deleted",
  "data": {}
}
```

### 2.3 Blog APIs

#### 2.3.1 Get All Blogs
- **Method**: `GET`
- **Endpoint**: `/blogs`
- **Auth**: None (public)
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "create_by": "user-id",
      "create_by_fullname": "Author Name",
      "title": "string",
      "image_urls": ["url1", "url2"],
      "subtitle": "string",
      "content": "string",
      "is_deleted": false,
      "created_date": "2024-01-01T00:00:00Z",
      "updated_date": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 2.3.2 Get Blog By ID
- **Method**: `GET`
- **Endpoint**: `/blogs/{id}`
- **Auth**: None (public)
- **Response**: Same as above (single object)

#### 2.3.3 Create Blog (JSON)
- **Method**: `POST`
- **Endpoint**: `/blogs`
- **Auth**: Required
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "create_by": "user-id",
  "title": "Blog Title",
  "image_urls": ["url1", "url2"],
  "subtitle": "Subtitle",
  "content": "Blog content"
}
```
- **Response**: Same as Get Blog By ID

#### 2.3.4 Create Blog (Form Data)
- **Method**: `POST`
- **Endpoint**: `/blogs/form`
- **Auth**: Required
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `create_by`: string (required)
  - `title`: string (required)
  - `subtitle`: string (optional)
  - `content`: string (required)
  - `image`: file (optional)
- **Response**: Same as Get Blog By ID

#### 2.3.5 Update Blog (JSON)
- **Method**: `PUT`
- **Endpoint**: `/blogs/{id}`
- **Auth**: Required
- **Content-Type**: `application/json`
- **Request Body**: Same as Create Blog
- **Response**: Same as Get Blog By ID

#### 2.3.6 Update Blog (Form Data)
- **Method**: `PUT`
- **Endpoint**: `/blogs/{id}/form`
- **Auth**: Required
- **Content-Type**: `multipart/form-data`
- **Form Data**: Same as Create Blog (Form Data)
- **Response**: Same as Get Blog By ID

#### 2.3.7 Delete Blog
- **Method**: `DELETE`
- **Endpoint**: `/blogs/{id}`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "message": "Blog deleted",
  "data": {}
}
```

### 2.4 Vietnam Address APIs

#### 2.4.1 Get Provinces
- **Method**: `GET`
- **Endpoint**: `/vietnam-address/provinces`
- **Auth**: None (public)
- **Response**: Returns JSON from external API

#### 2.4.2 Get Communes By Province
- **Method**: `GET`
- **Endpoint**: `/vietnam-address/provinces/{provinceId}/communes`
- **Auth**: None (public)
- **Response**: Returns JSON from external API

### 2.5 Health Check
- **Method**: `GET`
- **Endpoint**: `/api/health`
- **Auth**: None
- **Response**:
```json
{
  "message": "PatientService is running",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 3. Doctor Service APIs

**Base URL**: `http://localhost:8083/api/v1`  
**Gateway URL**: `http://localhost:8080/api/doctors/v1`

### 3.1 Folder APIs

#### 3.1.1 Create Folder
- **Method**: `POST`
- **Endpoint**: `/folders`
- **Auth**: Required
- **Request Body**:
```json
{
  "title": "Folder Title",
  "description": "Folder Description",
  "createdBy": "user-id",
  "type": "ANALYZE|TREATMENT|FOLLOW_UP"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Folder created successfully",
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "patientProfileId": "string",
    "chatSessionIds": ["id1", "id2"],
    "chatSessionsInfo": [
      {
        "id": "string",
        "title": "string",
        "isDeleted": false,
        "createdDate": "2024-01-01T00:00:00Z",
        "updatedDate": "2024-01-01T00:00:00Z"
      }
    ],
    "createdBy": "string",
    "isDeleted": false,
    "type": "ANALYZE",
    "createdDate": "2024-01-01T00:00:00Z",
    "updatedDate": "2024-01-01T00:00:00Z"
  },
  "statusCode": 201
}
```

#### 3.1.2 Get Folder By ID
- **Method**: `GET`
- **Endpoint**: `/folders/{folderId}`
- **Auth**: Required
- **Response**: Same as Create Folder

#### 3.1.3 Get Folders By User ID
- **Method**: `GET`
- **Endpoint**: `/folders/created-by?userId={userId}`
- **Auth**: Required
- **Query Params**: `userId` (required)
- **Response**:
```json
{
  "success": true,
  "message": "Folders found successfully",
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "patientProfileId": "string",
      "chatSessionIds": ["id1", "id2"],
      "chatSessionsInfo": [],
      "createdBy": "string",
      "isDeleted": false,
      "type": "ANALYZE",
      "createdDate": "2024-01-01T00:00:00Z",
      "updatedDate": "2024-01-01T00:00:00Z"
    }
  ],
  "statusCode": 200
}
```

#### 3.1.4 Update Folder
- **Method**: `PUT`
- **Endpoint**: `/folders/{folderId}`
- **Auth**: Required
- **Request Body**:
```json
{
  "title": "Updated Title",
  "description": "Updated Description"
}
```
- **Response**: Same as Create Folder

#### 3.1.5 Update Patient Profile ID
- **Method**: `PUT`
- **Endpoint**: `/folders/patient-profile/{folderId}`
- **Auth**: Required
- **Request Body**:
```json
{
  "patientProfileId": "patient-profile-id"
}
```
- **Response**: Same as Create Folder

#### 3.1.6 Delete Folder
- **Method**: `DELETE`
- **Endpoint**: `/folders/{folderId}`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "message": "Folder deleted successfully",
  "data": {
    "deleted": true
  },
  "statusCode": 200
}
```

### 3.2 Chat Session APIs

#### 3.2.1 Analyze and Create Chat Session
- **Method**: `POST`
- **Endpoint**: `/chatsessions/analyze-and-create-chatsession`
- **Auth**: Required
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `folderId`: string (required)
  - `title`: string (required)
  - `xrayImage`: file (required)
  - `patientProfileId`: string (optional)
- **Response**:
```json
{
  "success": true,
  "message": "Chat session created successfully",
  "data": {
    "id": "string",
    "sessionId": "string",
    "title": "string",
    "result": {
      "predicted_diseases": [],
      "top_5_diseases": [],
      "gradcam_analyses": {
        "top1_pneumothorax": "base64-image",
        "top2_atelectasis": "base64-image",
        "top3_edema": "base64-image",
        "top4_pneumonia": "base64-image",
        "top5_pleural_thickening": "base64-image"
      },
      "individual_analyses": {},
      "concise_conclusion": "string",
      "comprehensive_analysis": "string"
    },
    "xrayImageUrl": "string",
    "chatItems": [],
    "reports": [],
    "isDeleted": false,
    "createdDate": "2024-01-01T00:00:00Z",
    "updatedDate": "2024-01-01T00:00:00Z"
  },
  "statusCode": 200
}
```

#### 3.2.2 Create Text Chat Session
- **Method**: `POST`
- **Endpoint**: `/chatsessions/create-text-chatsession`
- **Auth**: Required
- **Request Body**:
```json
{
  "folderId": "folder-id",
  "title": "Chat Session Title"
}
```
- **Response**: Same as Analyze and Create Chat Session

#### 3.2.3 Get Chat Session By ID
- **Method**: `GET`
- **Endpoint**: `/chatsessions/{chatSessionId}`
- **Auth**: Required
- **Response**: Same as Analyze and Create Chat Session

#### 3.2.4 Get Chat Sessions By Folder ID
- **Method**: `GET`
- **Endpoint**: `/chatsessions/folder/{folderId}`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "message": "Chat sessions retrieved successfully",
  "data": [
    {
      "id": "string",
      "sessionId": "string",
      "title": "string",
      "result": {},
      "xrayImageUrl": "string",
      "chatItems": [],
      "reports": [],
      "isDeleted": false,
      "createdDate": "2024-01-01T00:00:00Z",
      "updatedDate": "2024-01-01T00:00:00Z"
    }
  ],
  "statusCode": 200
}
```

#### 3.2.5 Send Chat Message
- **Method**: `POST`
- **Endpoint**: `/chatsessions/{chatSessionId}/chat`
- **Auth**: Required
- **Request Body**:
```json
{
  "message": "User message",
  "action": "start_chat|continue_chat|analyze|question",
  "context": {
    "specialty": "string",
    "urgency": "low|medium|high",
    "includeReferences": true,
    "age": 30,
    "gender": "MALE|FEMALE"
  }
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Chat message processed successfully",
  "data": {
    "chatSessionId": "string",
    "userChatItem": {
      "id": "string",
      "message": "string",
      "sender": "USER",
      "timestamp": "2024-01-01T00:00:00Z"
    },
    "botChatItem": {
      "id": "string",
      "message": "string",
      "sender": "BOT",
      "timestamp": "2024-01-01T00:00:00Z"
    },
    "botResponse": {
      "summarizeAnswer": "string",
      "fullAnswer": "string",
      "pubmedQueryUrl": "string",
      "pubmedFetchUrl": "string"
    },
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "statusCode": 200
}
```

#### 3.2.6 Delete Chat Session
- **Method**: `DELETE`
- **Endpoint**: `/chatsessions/{chatSessionId}`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "message": "Chat session deleted successfully",
  "data": true,
  "statusCode": 200
}
```

#### 3.2.7 Test CliniAI Service
- **Method**: `GET`
- **Endpoint**: `/chatsessions/test-cliniai`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "message": "CliniAI service is available",
  "data": true,
  "statusCode": 200
}
```

#### 3.2.8 Test GradCam Processing
- **Method**: `POST`
- **Endpoint**: `/chatsessions/test-gradcam`
- **Auth**: Required
- **Request Body**:
```json
{
  "base64Image": "base64-encoded-image",
  "chatSessionId": "string"
}
```
- **Response**:
```json
{
  "success": true,
  "result": "processed-result"
}
```

#### 3.2.9 Query PubMed RAG
- **Method**: `POST`
- **Endpoint**: `/chatsessions/query-pubmed-rag`
- **Auth**: Required
- **Request Body**:
```json
{
  "question": "What is pneumonia?",
  "nResults": 3,
  "autoFetch": true,
  "autoFetchCount": 30
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Query processed successfully",
  "data": {
    "answer": "string",
    "sourcesCount": 3,
    "autoFetched": false
  },
  "statusCode": 200
}
```

### 3.3 Report APIs

#### 3.3.1 Create Report
- **Method**: `POST`
- **Endpoint**: `/reports`
- **Auth**: Required
- **Request Body**:
```json
{
  "title": "Report Title",
  "templateId": "template-id",
  "content": "Report content in markdown",
  "chatSessionId": "chat-session-id",
  "patientEmail": "patient@example.com"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Report created successfully",
  "data": {
    "id": "string",
    "title": "string",
    "templateId": "string",
    "content": "string",
    "chatSessionId": "string",
    "patientEmail": "string",
    "isSent": false,
    "sentDate": "2024-01-01T00:00:00Z",
    "createdDate": "2024-01-01T00:00:00Z",
    "updatedDate": "2024-01-01T00:00:00Z"
  },
  "statusCode": 201
}
```

#### 3.3.2 Get Report By ID
- **Method**: `GET`
- **Endpoint**: `/reports/{reportId}`
- **Auth**: Required
- **Response**: Same as Create Report

#### 3.3.3 Get Reports By Chat Session ID
- **Method**: `GET`
- **Endpoint**: `/reports/chat-session/{chatSessionId}`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "message": "Reports retrieved successfully",
  "data": [
    {
      "id": "string",
      "title": "string",
      "templateId": "string",
      "content": "string",
      "chatSessionId": "string",
      "patientEmail": "string",
      "isSent": false,
      "sentDate": "2024-01-01T00:00:00Z",
      "createdDate": "2024-01-01T00:00:00Z",
      "updatedDate": "2024-01-01T00:00:00Z"
    }
  ],
  "statusCode": 200
}
```

#### 3.3.4 Get Reports By Patient Email
- **Method**: `GET`
- **Endpoint**: `/reports/patient/{patientEmail}`
- **Auth**: Required
- **Response**: Same as Get Reports By Chat Session ID

#### 3.3.5 Update Report
- **Method**: `PUT`
- **Endpoint**: `/reports/{reportId}`
- **Auth**: Required
- **Request Body**:
```json
{
  "title": "Updated Title",
  "templateId": "template-id",
  "content": "Updated content",
  "patientEmail": "patient@example.com",
  "isSent": true,
  "sentDate": "2024-01-01T00:00:00Z"
}
```
- **Response**: Same as Create Report

#### 3.3.6 Send Report
- **Method**: `POST`
- **Endpoint**: `/reports/{reportId}/send`
- **Auth**: Required
- **Response**: Same as Create Report

#### 3.3.7 Delete Report
- **Method**: `DELETE`
- **Endpoint**: `/reports/{reportId}`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "message": "Report deleted successfully",
  "data": {
    "deleted": true
  },
  "statusCode": 200
}
```

### 3.4 Health Check
- **Method**: `GET`
- **Endpoint**: `/api/health`
- **Auth**: None
- **Response**:
```json
{
  "message": "DoctorService is running",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 4. Admin Service APIs

**Base URL**: `http://localhost:8086/api/v1`  
**Gateway URL**: `http://localhost:8080/api/admin/v1`

### 4.1 User Management APIs

#### 4.1.1 Create Account
- **Method**: `POST`
- **Endpoint**: `/users/create-account`
- **Auth**: Required (Admin)
- **Request Body**:
```json
{
  "email": "user@example.com",
  "fullname": "User Name",
  "password": "password123",
  "role": "PATIENT|DOCTOR|ADMIN"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "email": "string",
    "fullname": "string",
    "phone": "string",
    "dateOfBirth": "2024-01-01T00:00:00Z",
    "role": "string",
    "isEnable": true,
    "lastLoginDate": "2024-01-01T00:00:00Z",
    "createdDate": "2024-01-01T00:00:00Z",
    "updatedDate": "2024-01-01T00:00:00Z"
  },
  "statusCode": 201
}
```

#### 4.1.2 Get All Users
- **Method**: `GET`
- **Endpoint**: `/users`
- **Auth**: Required (Admin)
- **Response**:
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "email": "string",
      "fullname": "string",
      "phone": "string",
      "dateOfBirth": "2024-01-01T00:00:00Z",
      "role": "string",
      "isEnable": true,
      "lastLoginDate": "2024-01-01T00:00:00Z",
      "createdDate": "2024-01-01T00:00:00Z",
      "updatedDate": "2024-01-01T00:00:00Z"
    }
  ],
  "statusCode": 200
}
```

#### 4.1.3 Get User By Email
- **Method**: `POST`
- **Endpoint**: `/users/by-email`
- **Auth**: Required (Admin)
- **Request Body**:
```json
{
  "email": "user@example.com"
}
```
- **Response**: Same as Create Account (single object)

#### 4.1.4 Update User
- **Method**: `PUT`
- **Endpoint**: `/users`
- **Auth**: Required (Admin)
- **Request Body**:
```json
{
  "email": "user@example.com",
  "fullname": "Updated Name",
  "phone": "1234567890",
  "dateOfBirth": "1990-01-01T00:00:00Z",
  "password": "newpassword"
}
```
- **Response**: Same as Create Account

#### 4.1.5 Delete User
- **Method**: `DELETE`
- **Endpoint**: `/users`
- **Auth**: Required (Admin)
- **Request Body**:
```json
{
  "email": "user@example.com"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "deleted": true
  },
  "statusCode": 200
}
```

#### 4.1.6 Update User Status
- **Method**: `PATCH`
- **Endpoint**: `/users/status`
- **Auth**: Required (Admin)
- **Request Body**:
```json
{
  "email": "user@example.com",
  "isEnable": false
}
```
- **Response**: Same as Create Account

### 4.2 Report Template APIs

#### 4.2.1 Create Report Template
- **Method**: `POST`
- **Endpoint**: `/report-templates`
- **Auth**: Required (Admin)
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: file (required) - Markdown file
  - `userId`: string (required)
  - `name`: string (optional)
- **Response**:
```json
{
  "success": true,
  "message": "Report template created successfully",
  "data": {
    "id": "string",
    "name": "string",
    "template": "string",
    "fileLink": "string",
    "createBy": "string",
    "isDeleted": false,
    "createdDate": "2024-01-01T00:00:00Z",
    "updatedDate": "2024-01-01T00:00:00Z"
  },
  "statusCode": 201
}
```

#### 4.2.2 Get All Report Templates
- **Method**: `GET`
- **Endpoint**: `/report-templates`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "message": "Report templates retrieved successfully",
  "data": [
    {
      "id": "string",
      "name": "string",
      "template": "string",
      "fileLink": "string",
      "createBy": "string",
      "isDeleted": false,
      "createdDate": "2024-01-01T00:00:00Z",
      "updatedDate": "2024-01-01T00:00:00Z"
    }
  ],
  "statusCode": 200
}
```

#### 4.2.3 Get Report Template By ID
- **Method**: `GET`
- **Endpoint**: `/report-templates/{id}`
- **Auth**: Required
- **Response**: Same as Create Report Template (single object)

#### 4.2.4 Update Report Template
- **Method**: `PUT`
- **Endpoint**: `/report-templates/{id}`
- **Auth**: Required (Admin)
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: file (optional)
  - `name`: string (optional)
  - `template`: string (optional)
  - `fileLink`: string (optional)
  - `isDeleted`: boolean (optional)
- **Response**: Same as Create Report Template

### 4.3 Health Check
- **Method**: `GET`
- **Endpoint**: `/api/health`
- **Auth**: None
- **Response**:
```json
{
  "message": "AdminService is running",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 5. RAG-Pubmed Service APIs

**Base URL**: `http://localhost:8001`

### 5.1 Root Endpoint
- **Method**: `GET`
- **Endpoint**: `/`
- **Auth**: None
- **Response**:
```json
{
  "name": "Medical RAG API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "index": "POST /index - Index articles from PubMed",
    "query": "POST /query - Query the knowledge base",
    "stats": "GET /stats - Get database statistics",
    "clear": "DELETE /clear - Clear all data from database"
  }
}
```

### 5.2 Health Check
- **Method**: `GET`
- **Endpoint**: `/health`
- **Auth**: None
- **Response**:
```json
{
  "status": "healthy",
  "rag_initialized": true,
  "total_articles": 100
}
```

### 5.3 Crawl/Index Articles
- **Method**: `POST`
- **Endpoint**: `/crawl`
- **Auth**: None
- **Request Body**:
```json
{
  "query": "diabetes treatment",
  "max_results": 50
}
```
- **Response**:
```json
{
  "status": "success",
  "message": "Successfully indexed articles for query: 'diabetes treatment'",
  "total_articles": "150"
}
```

### 5.4 Query RAG System
- **Method**: `POST`
- **Endpoint**: `/query`
- **Auth**: None
- **Request Body**:
```json
{
  "question": "What are the symptoms of pneumonia?",
  "n_results": 5,
  "auto_fetch": true,
  "auto_fetch_count": 30
}
```
- **Response**:
```json
{
  "answer": "Based on medical research...",
  "sources_count": 5,
  "auto_fetched": false
}
```

### 5.5 Get Statistics
- **Method**: `GET`
- **Endpoint**: `/stats`
- **Auth**: None
- **Response**:
```json
{
  "total_articles": 100,
  "collection_name": "pubmed_articles",
  "status": "success"
}
```

### 5.6 Clear Database
- **Method**: `DELETE`
- **Endpoint**: `/clear`
- **Auth**: None
- **Response**:
```json
{
  "success": true,
  "message": "Successfully cleared 100 articles from collection 'pubmed_articles'",
  "deleted_count": 100
}
```

---

## Common Response Structure

All APIs (except RAG-Pubmed) follow a standard response structure:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "statusCode": 200
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error message",
  "stack": "Stack trace (in development)",
  "statusCode": 400
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "fieldName": ["Error message 1", "Error message 2"]
  },
  "statusCode": 400
}
```

---

## Roles

- **PATIENT**: Basic user role
- **DOCTOR**: Doctor/medical professional role
- **ADMIN**: Administrator role

---

## Notes

1. **Authentication**: Most endpoints require JWT authentication. Get the access token from the `/login` endpoint and include it in the `Authorization` header as `Bearer <token>`.

2. **File Uploads**: For endpoints that accept file uploads, use `multipart/form-data` content type.

3. **Dates**: All dates are in ISO 8601 format (e.g., `2024-01-01T00:00:00Z`).

4. **Enums**: 
   - `Gender`: `MALE`, `FEMALE`, `OTHER`
   - `Role`: `PATIENT`, `DOCTOR`, `ADMIN`
   - `FolderType`: `ANALYZE`, `TREATMENT`, `FOLLOW_UP`

5. **API Gateway**: All services can be accessed through the API Gateway at `http://localhost:8080` with the following prefixes:
   - `/api/auth` → IdentityService
   - `/api/doctors` → DoctorService
   - `/api/patients` → PatientService
   - `/api/admin` → AdminService

6. **Internal APIs**: Some endpoints marked as "Internal" are for service-to-service communication and require a system secret instead of JWT.

7. **Health Checks**: All services provide a health check endpoint at `/api/health` (except RAG-Pubmed which uses `/health`).

---

## Postman Collection Tips

1. Create a collection variable for the base URL: `{{base_url}}` = `http://localhost:8080`
2. Create a collection variable for the access token: `{{access_token}}`
3. Set up a Pre-request Script to automatically add the Authorization header:
   ```javascript
   pm.request.headers.add({
       key: 'Authorization',
       value: 'Bearer ' + pm.collectionVariables.get('access_token')
   });
   ```
4. Use the login endpoint to get the token and save it to the collection variable automatically.

---

## Testing Workflow

1. **Register/Login** → Get access token
2. **Create Folder** → Get folder ID
3. **Create Patient Profile** → Get patient profile ID (optional)
4. **Create Chat Session** → Upload X-ray image and get analysis
5. **Send Chat Messages** → Interact with AI chatbot
6. **Create Report** → Generate medical report
7. **Send Report** → Send report to patient
8. **View Reports** → Patient views reports

---

**Last Updated**: 2024-01-01

