# 📡 API Reference

Base URL: `https://writegy.onrender.com`

## 🔐 Authentication (Supabase JWT-Based)

Authentication uses **OAuth2 Resource Server** with Supabase JWT validation. Password handling is completely managed by Supabase Auth.

### Authentication Flow:
1. **Frontend** calls Supabase Auth directly for login/register
2. **Supabase** returns JWT to frontend
3. **Frontend** sends JWT in `Authorization: Bearer <token>` header
4. **Backend** validates JWT automatically

### Sync User to Backend
`POST /auth/sync`

**Description:** Syncs a Supabase-authenticated user to the backend's PostgreSQL database.

**Headers:** `Authorization: Bearer <SUPABASE_JWT>`

**Response (Success 200):**
```json
{
  "message": "User synced successfully"
}
```

### Get Current User
`GET /auth/me`

**Description:** Retrieves current user information from validated JWT.

**Headers:** `Authorization: Bearer <SUPABASE_JWT>`

**Response (Success 200):**
```json
{
  "token": null,
  "email": "user@example.com",
  "fullName": "John Doe"
}
```


### **Production (Render)**
```bash
https://writegy-backend.onrender.com
```

## 📋 **API Endpoints**

All endpoints return JSON responses. Content-Type: `application/json`

### **1. Get All Documents**
```http
GET /api/documents
```

**Description:** Retrieve list of all documents.

**Example Request:**
```bash
curl http://localhost:8080/api/documents
```

**Response (Success 200):**
```json
[
  {
    "id": 1,
    "title": "My First Document",
    "content": "This is the document content",
    "createdAt": "2025-12-12T10:30:00Z"
  }
]
```

### **2. Create New Document (Hybrid Upload)**
```http
POST /api/documents
```

**Description:** Upload document file to Supabase Storage and save pre-extracted text content to database with automatic word/character counting.

**Content-Type:** `multipart/form-data`

**Request Parameters:**
- `file` (MultipartFile): PDF/DOCX file for storage (max 5MB, optional)
- `title` (string): Document title
- `content` (string): Pre-extracted text content from frontend

**Example Request:**
```bash
# Upload PDF file + pre-extracted content (hybrid approach)
curl -X POST http://localhost:8080/api/documents \
  -F "file=@document.pdf" \
  -F "title=My Research Paper" \
  -F "content=This is the extracted text from the PDF..."
```

**Response (Success 200):**
```json
{
  "id": 1,
  "title": "My Research Paper",
  "content": "This is the extracted text from the PDF...",
  "wordCount": 8,
  "characterCount": 36,
  "status": "DRAFT",
  "createdAt": "2025-12-12T10:30:00Z",
  "updatedAt": "2025-12-12T10:30:00Z"
}
```

**Features:**
- ✅ **Automatic Word Counting** - Calculated from content
- ✅ **Character Counting** - Excludes whitespace
- ✅ **File Storage** - Optional file upload to Supabase
- ✅ **Legacy Support** - Auto-updates old documents without counts

**Resource Benefits:**
- ✅ ~20MB memory vs ~100MB (before Tika removal)
- ✅ ~200ms response time vs 2000ms (before Tika removal)
- ✅ File validation retained for security
- ✅ Supabase Storage properly integrated

### **3. Get Document by ID**
```http
GET /api/documents/{id}
```

**Description:** Retrieve a specific document by its ID.

**URL Parameters:**
- `id` (integer): Document ID

**Example Request:**
```bash
curl http://localhost:8080/api/documents/1
```

**Response (Success 200):**
```json
{
  "id": 1,
  "title": "Hello World",
  "content": "My first API call!",
  "createdAt": "2025-12-12T10:30:00Z"
}
```

**Response (Not Found 404):**
```json
// Empty response body
```

### **4. Update Document**
```http
PUT /api/documents/{id}
```

**Description:** Update an existing document's title and/or content.

**URL Parameters:**
- `id` (integer): Document ID to update

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content here..."
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:8080/api/documents/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","content":"Better content now!"}'
```

**Response (Success 200):**
```json
{
  "id": 1,
  "title": "Updated Title",
  "content": "Better content now!",
  "createdAt": "2025-12-12T10:30:00Z"
}
```

**Response (Not Found 404):**
```json
// Empty response body
```

### **5. Delete Document**
```http
DELETE /api/documents/{id}
```

**Description:** Delete a document by its ID.

**URL Parameters:**
- `id` (integer): Document ID to delete

**Example Request:**
```bash
curl -X DELETE http://localhost:8080/api/documents/1
```

**Response (Success 204):**
```json
// No content returned (successful deletion)
```

**Response (Not Found 404):**
```json
// Empty response body
```

### **6. Document Hierarchy Management**
```http
GET /api/documents/tree
```

**Description:** Get the full document tree for the current user.

**Example Request:**
```bash
curl http://localhost:8080/api/documents/tree
```

**Response (Success 200):**
```json
[
  {
    "id": 1,
    "title": "Parent Document",
    "content": "Parent content",
    "depth": 0,
    "treeOrder": 0,
    "children": []
  }
]
```

```http
POST /api/documents/{id}/parent
```

**Description:** Set the parent relationship for a document.

**URL Parameters:**
- `id` (integer): Document ID to update

**Request Parameters:**
- `parentId` (integer): Parent document ID

**Example Request:**
```bash
curl -X POST "http://localhost:8080/api/documents/2/parent?parentId=1"
```

**Response (Success 200):**
```json
{
  "id": 2,
  "title": "Child Document",
  "content": "Child content",
  "parentId": 1,
  "depth": 1,
  "treeOrder": 0
}
```

```http
DELETE /api/documents/{id}/parent
```

**Description:** Remove the parent relationship for a document (make it a root document).

**URL Parameters:**
- `id` (integer): Document ID to update

**Example Request:**
```bash
curl -X DELETE http://localhost:8080/api/documents/2/parent
```

**Response (Success 200):**
```json
{
  "id": 2,
  "title": "Child Document",
  "content": "Child content",
  "parentId": null,
  "depth": 0,
  "treeOrder": 0
}
```

```http
GET /api/documents/{id}/children
```

**Description:** Get all child documents for the specified parent document.

**URL Parameters:**
- `id` (integer): Parent document ID

**Example Request:**
```bash
curl http://localhost:8080/api/documents/1/children
```

**Response (Success 200):**
```json
[
  {
    "id": 2,
    "title": "Child Document 1",
    "content": "First child document",
    "parentId": 1,
    "createdAt": "2025-12-12T10:30:00Z"
  },
  {
    "id": 3,
    "title": "Child Document 2",
    "content": "Second child document",
    "parentId": 1,
    "createdAt": "2025-12-12T10:35:00Z"
  }
]
```

### **7. Grammar Check (AI-Powered)**
```http
POST /api/grammar/check
```

**Description:** Analyze text for grammar errors, spelling mistakes, punctuation issues, and writing style suggestions using AI.

**Request Body:**
```json
{
  "text": "This is the text to check for grammer errors."
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/api/grammar/check \
  -H "Content-Type: application/json" \
  -d '{"text":"This is the body text to save anc check grammer"}'
```

**Response (Success 200):**
```json
"AI Grammar Analysis:\n**Analysis Report**\n\n**1. Grammar Errors and Spelling Mistakes**\n\n* \"anc\" should be spelled as \"and\"\n* \"grammer\" should be spelled as \"grammar\"\n\n**2. Punctuation Issues**\n\n* The text lacks punctuation, making it difficult to understand. Consider adding commas, periods, or other punctuation marks to separate ideas and improve clarity.\n\n..."
```

**Features:**
- ✅ **AI-Powered Analysis** - Grammar, spelling, style suggestions
- ✅ **Comprehensive Feedback** - Detailed actionable recommendations
- ✅ **Caching Enabled** - Faster responses for repeated checks
- ✅ **Rate Limited** - 20 checks per hour per user
- ✅ **Fallback Support** - Basic checks when AI unavailable

## 🔍 **Health & Monitoring Endpoints**

### **Application Health**
```http
GET /actuator/health
```

**Description:** Check application health status.

**Response (Success 200):**
```json
{
  "status": "UP"
}
```

### **Application Info**
```http
GET /actuator/info
```

**Description:** Get application information.

### **Application Metrics**
```http
GET /actuator/metrics
```

**Description:** Get application performance metrics.

## 🚀 **Spring Boot Features**

The API includes these Spring Boot features:

### **Swagger/OpenAPI Documentation**
```bash
GET /swagger-ui.html
```
Interactive API documentation at runtime.

### **API Docs (JSON)**
```bash
GET /api-docs
```
OpenAPI specification in JSON format.

## 🗂️ **Data Model**

### **Document Object**
```json
{
  "id": "integer (auto-generated)",
  "title": "string (required)",
  "content": "string (required)",
  "createdAt": "ISO-8601 timestamp (auto-generated)"
}
```

**Field Constraints:**
- `id`: Auto-generated unique identifier
- `title`: Required, 1-500 characters
- `content`: Required, can be empty string ""
- `createdAt`: Auto-generated timestamp (UTC)

## 💾 **Current Storage**

### **Development Profile (`dev`)**
- **Database:** H2 (in-memory)
- **Persistence:** Data resets on restart
- **Purpose:** Easy local development

**Pros:**
- No setup required
- Fast startup
- Perfect for learning

### **Production Profile (`prod`)**
- **Database:** Supabase PostgreSQL
- **Persistence:** Permanent data storage
- **Purpose:** Live production use

## 🧪 **Testing Examples**

### **Complete CRUD Cycle**
```bash
# 1. Create document
curl -X POST http://localhost:8080/api/documents \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Doc","content":"Testing CRUD operations"}'

# 2. Get document (note the returned ID)
curl http://localhost:8080/api/documents/1

# 3. Update document
curl -X PUT http://localhost:8080/api/documents/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Test Doc","content":"Updated content"}'

# 4. Delete document
curl -X DELETE http://localhost:8080/api/documents/1

# 5. Verify deletion
curl http://localhost:8080/api/documents
```

## 🚨 **Error Handling**

### **Comprehensive Error Responses**

The API provides detailed error responses for all scenarios:

#### **Standard HTTP Status Codes**
- `200 OK` - Request successful
- `204 No Content` - Successful deletion
- `400 Bad Request` - Invalid request data
- `413 Payload Too Large` - File upload exceeds 5MB limit
- `429 Too Many Requests` - Rate limit exceeded (20 grammar checks/hour)
- `500 Internal Server Error` - Unexpected server error
- `503 Service Unavailable` - External service (Supabase Storage / LanguageTool) unavailable

#### **Enhanced Error Response Format**
```json
{
  "timestamp": "2025-12-12T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Detailed error description",
  "path": "/api/endpoint"
}
```

#### **Specific Error Examples**

**File Size Limit (413):**
```json
{
  "timestamp": "2025-12-12T10:30:00",
  "status": 413,
  "error": "Payload Too Large",
  "message": "File upload exceeds maximum allowed size (5MB) for free tier compatibility",
  "path": "/api/documents"
}
```

**Rate Limit Exceeded (429):**
```json
{
  "timestamp": "2025-12-12T10:30:00",
  "status": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again later.",
  "retryAfter": 3600
}
```

**Service Unavailable (503):**
```json
{
  "timestamp": "2025-12-12T10:30:00",
  "status": 503,
  "error": "Service Unavailable",
  "message": "LanguageTool API is currently unavailable. Please try again later.",
  "path": "/api/grammar/check"
}
```

## ♿ **Accessibility Features**

### **Frontend Accessibility Implementation**
The application includes comprehensive accessibility features following WCAG 2.1 AA guidelines:

#### **ARIA Labels & Semantic HTML**
- Proper semantic HTML structure with landmarks (`<header>`, `<main>`, `<aside>`, `<footer>`)
- ARIA labels on all interactive elements
- Screen reader announcements for dynamic content updates
- Live regions for status messages

#### **Keyboard Navigation**
- Full keyboard accessibility with logical tab order
- Skip links for bypassing navigation
- Focus management with visible focus indicators
- Keyboard shortcuts documented and accessible

#### **Screen Reader Support**
- Comprehensive screen reader compatibility
- Alt text and ARIA descriptions for all UI elements
- Live announcements for grammar check results
- Proper heading hierarchy (h1 → h2 → h3)

#### **Text Highlighting**
- Interactive text highlighting when hovering over grammar suggestions
- Visual feedback showing which text corresponds to each suggestion
- Temporary highlighting that doesn't affect document content

## 🔐 **Security (Implemented)**

The API implements enterprise-grade security optimized for production:

### **Authentication & Authorization**
- **OAuth2 Resource Server** with Supabase JWT validation
- Automatic JWT token validation on all protected endpoints
- Stateless authentication (no server-side sessions)
- User synchronization between Supabase and PostgreSQL

### **Rate Limiting & Throttling**
- **Per-user rate limiting**: 20 grammar checks per hour
- HTTP 429 responses with detailed retry information
- Global request throttling to prevent abuse

### **File Upload Security**
- **5MB size limit** optimized for 512MB free tier
- Content-type validation (PDF, DOC, DOCX only)
- Extension verification as additional security layer
- Memory-safe processing with singleton Apache Tika

### **CORS Protection**
- Environment-based allowed origins configuration
- Credentials enabled for authenticated requests
- Proper preflight handling with 3600-second cache

### **Data Protection**
- HTTPS-only communication channels
- Secure JWT validation with signature verification
- Password handling entirely managed by Supabase
- Comprehensive input validation and sanitization

### **API Key Security**
- All sensitive keys properly excluded from version control via `.gitignore`
- Environment variable configuration for production deployments
- No hardcoded secrets in codebase

## 📊 **Performance Optimizations**

### **Memory Management**
- **Java 25** with compact object headers (-10% memory)
- **AWS SDK v2** with 40-60% memory reduction
- **Singleton Apache Tika** with minimal PDF/DOCX modules
- **Optimized HikariCP** connection pooling (3 max, 1 min)

### **Caching Strategy**
- **Caffeine cache** for grammar check responses
- **100-entry cache** with 1-hour expiration
- **Smart cache invalidation** for updated content

### **Response Times**
- API endpoints: <50ms average response time
- **Health checks**: Sub-millisecond responses
- **Caching**: <10ms for cached grammar responses
- **File processing**: Optimized for 5MB documents

### **Free Tier Compatibility**
- **512MB RAM limit**: Application uses max 70MB under load
- **Connection pooling**: Prevents database connection exhaustion
- **Async processing**: Non-blocking file uploads
- **Static resource optimization**: Efficient dependency loading

## 🔗 **Related Documentation**

- **[DEVELOPMENT-SETUP.md](DEVELOPMENT-SETUP.md)** - Development environment setup
- **[DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)** - Deploy to Render/Supabase
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture overview
- **[ADRs](./ADRs)** - Architectural Decision Records

## 💡 **API Development Tips**

### **For Java Beginners:**
1. Use tools like Postman or Insomnia for testing
2. Check server logs for debugging
3. Study `DocumentController.java` for implementation details
4. Practice with the CRUD cycle exercises above

### **For API Integration:**
1. Always handle both success and error responses
2. Implement proper error logging on client side
3. Use appropriate HTTP status codes in your apps
4. Consider adding loading states for better UX

---

**Ready to test?** Start with: `curl http://localhost:8080/api/documents` 🚀
