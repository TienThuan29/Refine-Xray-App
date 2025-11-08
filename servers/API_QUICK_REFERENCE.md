# API Quick Reference - RefineXray App

## Base URLs
- **Gateway**: `http://localhost:8080`
- **IdentityService**: `http://localhost:8082`
- **DoctorService**: `http://localhost:8083`
- **PatientService**: `http://localhost:8085`
- **AdminService**: `http://localhost:8086`
- **RAG-Pubmed**: `http://localhost:8001`

---

## Identity Service (Auth)

### Base: `/api/v1` or `/api/auth/v1` (Gateway)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/login` | None | Login user |
| POST | `/register/patient` | None | Register patient |
| POST | `/refresh` | None | Refresh token |
| GET | `/profile` | Required | Get user profile |
| GET | `/users` | Admin | Get all users |
| POST | `/users/by-email` | Required | Get user by email |
| POST | `/internal/users/by-email` | System | Get user by email (internal) |
| POST | `/internal/users/by-id` | System | Get user by ID (internal) |
| PUT | `/users` | Admin | Update user |
| DELETE | `/users` | Admin | Delete user |
| PUT | `/users/status` | Admin | Update user status |
| GET | `/api/health` | None | Health check |

---

## Patient Service

### Base: `/api/v1` or `/api/patients/v1` (Gateway)

#### Patient Profiles
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/patient-profiles` | Required | Get all profiles |
| GET | `/patient-profiles/{id}` | Required | Get profile by ID |
| POST | `/patient-profiles?folderId={id}` | Required | Create profile |
| PUT | `/patient-profiles/{id}` | Required | Update profile |
| DELETE | `/patient-profiles/{id}` | Required | Delete profile |

#### Patient Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/patient-reports` | Required | Create report |
| GET | `/patient-reports/patient/{email}` | Required | Get reports by email |
| PUT | `/patient-reports/{id}/mark-read` | Required | Mark as read |
| DELETE | `/patient-reports/{id}` | Required | Delete report |

#### Blogs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/blogs` | None | Get all blogs |
| GET | `/blogs/{id}` | None | Get blog by ID |
| POST | `/blogs` | Required | Create blog (JSON) |
| POST | `/blogs/form` | Required | Create blog (Form) |
| PUT | `/blogs/{id}` | Required | Update blog (JSON) |
| PUT | `/blogs/{id}/form` | Required | Update blog (Form) |
| DELETE | `/blogs/{id}` | Required | Delete blog |

#### Vietnam Address
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/vietnam-address/provinces` | None | Get provinces |
| GET | `/vietnam-address/provinces/{id}/communes` | None | Get communes |

#### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | Health check |

---

## Doctor Service

### Base: `/api/v1` or `/api/doctors/v1` (Gateway)

#### Folders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/folders` | Required | Create folder |
| GET | `/folders/{id}` | Required | Get folder by ID |
| GET | `/folders/created-by?userId={id}` | Required | Get folders by user |
| PUT | `/folders/{id}` | Required | Update folder |
| PUT | `/folders/patient-profile/{id}` | Required | Update patient profile ID |
| DELETE | `/folders/{id}` | Required | Delete folder |

#### Chat Sessions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/chatsessions/analyze-and-create-chatsession` | Required | Create session with image |
| POST | `/chatsessions/create-text-chatsession` | Required | Create text session |
| GET | `/chatsessions/{id}` | Required | Get session by ID |
| GET | `/chatsessions/folder/{id}` | Required | Get sessions by folder |
| POST | `/chatsessions/{id}/chat` | Required | Send chat message |
| DELETE | `/chatsessions/{id}` | Required | Delete session |
| GET | `/chatsessions/test-cliniai` | Required | Test CliniAI |
| POST | `/chatsessions/test-gradcam` | Required | Test GradCam |
| POST | `/chatsessions/query-pubmed-rag` | Required | Query PubMed RAG |

#### Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/reports` | Required | Create report |
| GET | `/reports/{id}` | Required | Get report by ID |
| GET | `/reports/chat-session/{id}` | Required | Get reports by chat session |
| GET | `/reports/patient/{email}` | Required | Get reports by patient |
| PUT | `/reports/{id}` | Required | Update report |
| POST | `/reports/{id}/send` | Required | Send report |
| DELETE | `/reports/{id}` | Required | Delete report |

#### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | Health check |

---

## Admin Service

### Base: `/api/v1` or `/api/admin/v1` (Gateway)

#### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users/create-account` | Admin | Create account |
| GET | `/users` | Admin | Get all users |
| POST | `/users/by-email` | Admin | Get user by email |
| PUT | `/users` | Admin | Update user |
| DELETE | `/users` | Admin | Delete user |
| PATCH | `/users/status` | Admin | Update user status |

#### Report Templates
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/report-templates` | Admin | Create template |
| GET | `/report-templates` | Required | Get all templates |
| GET | `/report-templates/{id}` | Required | Get template by ID |
| PUT | `/report-templates/{id}` | Admin | Update template |

#### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | Health check |

---

## RAG-Pubmed Service

### Base: `http://localhost:8001`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | None | Root endpoint |
| GET | `/health` | None | Health check |
| POST | `/crawl` | None | Index articles |
| POST | `/query` | None | Query RAG system |
| GET | `/stats` | None | Get statistics |
| DELETE | `/clear` | None | Clear database |

---

## Common Request/Response Patterns

### Authentication Header
```
Authorization: Bearer <access_token>
```

### Standard Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "statusCode": 200
}
```

### Standard Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error",
  "statusCode": 400
}
```

### File Upload
- Use `multipart/form-data` content type
- Include file in form data

### Common Enums
- **Gender**: `MALE`, `FEMALE`, `OTHER`
- **Role**: `PATIENT`, `DOCTOR`, `ADMIN`
- **FolderType**: `ANALYZE`, `TREATMENT`, `FOLLOW_UP`

---

## Testing Workflow

1. **Login** → Get access token
2. **Create Folder** → Get folder ID
3. **Create Patient Profile** (optional) → Get patient profile ID
4. **Create Chat Session** → Upload X-ray, get analysis
5. **Send Chat Messages** → Interact with AI
6. **Create Report** → Generate report
7. **Send Report** → Send to patient
8. **View Reports** → Patient views

---

## Postman Setup

### Variables
- `base_url`: `http://localhost:8080`
- `access_token`: (set after login)
- `identity_service`: `http://localhost:8082`
- `doctor_service`: `http://localhost:8083`
- `patient_service`: `http://localhost:8085`
- `admin_service`: `http://localhost:8086`
- `rag_service`: `http://localhost:8001`

### Pre-request Script (for authenticated endpoints)
```javascript
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.collectionVariables.get('access_token')
});
```

### Test Script (for login - save token)
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.accessToken) {
        pm.collectionVariables.set('access_token', jsonData.data.accessToken);
    }
}
```

---

**See API_DOCUMENTATION.md for detailed request/response examples.**

