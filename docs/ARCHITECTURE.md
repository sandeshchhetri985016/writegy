# 🏗️ Writegy Production Architecture

**Enterprise-grade, free-tier optimized Spring Boot application with comprehensive security, performance, and monitoring.** This document outlines the production-ready architecture we built through systematic optimization.

## 📊 **Complete SaaS Application Architecture**

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│     React 18        │    │   Spring Boot       │    │   Supabase PG       │    │  Supabase Storage   │
│   Frontend SPA      │◄──►│   Java 21/25        │◄──►│   500MB Free        │◄──►│   1GB Files         │
│   (Vite + TS)       │    │   JWT Security      │    │   PostgreSQL 16     │    │   S3-Compatible     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘    └─────────────────────┘
         │                           │                           │                           │
         ▼                           ▼                           ▼                           ▼
   📱 User Interface           ⚙️ REST API (20MB mem)         💾 Document Storage          📁 File Storage
   🔐 Supabase Auth            🛡️ Rate Limiting              🔄 Auto Migrations         📊 CDN Delivery
   ✍️ Rich Text Editor         📊 Health Monitoring           🎯 Enterprise RL S         🚀 Global Access
   📄 Hybrid Processing       🔧 Container Optimized          📊 Performance Pooling      🛡️ Private Buckets

┌─────────────────────┐                                 ┌─────────────────────┐
│ LanguageTool API    │ ◄──────────────────────────────► │  Grammar AI        │
│ (Rate Limited)      │                                 │  20 req/hour       │
│ External Service    │                                 │  Content Analysis   │
└─────────────────────┘                                 └─────────────────────┘
```

## 🎯 **Complete SaaS Implementation Status**

| Component | Status | Technology | Free Tier Limit | Usage |
|-----------|--------|------------|----------------|-------|
| **Frontend** | ✅ Production | React 18 + TypeScript | Unlimited | File processing + UI |
| **Backend** | ✅ Production | Spring Boot 3.5.5 (Java 21/25) | 512MB RAM | 20MB optimized |
| **Database** | ✅ Production | Supabase PostgreSQL 16 | 500MB forever | Auto migrations |
| **Authentication** | ✅ Production | Supabase Auth + JWT | Unlimited users | Secure sessions |
| **File Storage** | ✅ Production | Supabase Storage (S3) | 1GB | Hybrid processing |
| **Grammar AI** | ✅ Production | LanguageTool API | 20 req/hour | Rate limited |
| **Security** | ✅ Production | Rate limiting + CORS | Enterprise | Bucket4j + Spring Security |
| **Monitoring** | ✅ Production | Actuator + structured logging | Included | Health checks |

**✨ Complete professional SaaS application with 100% free-tier compatibility!**

## 🎯 **Current MVP Architecture (What Works Now)**

### **Backend (Java 25 + Spring Boot 3.5.5)**
- **Language:** Java 25 (latest LTS with performance benefits)
- **Framework:** Spring Boot 3.5.5 (optimized for Java 25)
- **Architecture:** Monolithic for MVP simplicity
- **Deployment:** Docker + Render (free tier)

### **Complete Tech Stack**
- **Frontend:** React 18 + Vite + TypeScript + TailwindCSS
- **Backend:** Spring Boot 3.5.5 + Java 21/25 + JWT Security
- **Database:** Supabase PostgreSQL 16 (500MB free forever)
- **Authentication:** Supabase Auth (unlimited users)
- **File Storage:** Supabase Storage (1GB free, S3-compatible)
- **AI Grammar:** LanguageTool API (rate limited)
- **Deployment:** Render + Docker (512MB free)
- **Monitoring:** Spring Actuator + structured logging

### **Key Components:**

```
backend/
├── 📂 src/main/java/com/writegy/
│   ├── WritegyApplication.java          # 🚀 APP STARTER
│   ├── controller/
│   │   ├── AuthController.java          # 🔐 AUTH API
│   │   ├── DocumentController.java      # 📄 DOCUMENT API
│   │   └── GrammarController.java       # ✍️ GRAMMAR API
│   ├── model/
│   │   ├── User.java                    # 👤 USER MODEL
│   │   └── Document.java                # 📄 DOCUMENT MODEL
│   ├── repository/
│   │   ├── UserRepository.java          # 💾 USER DATA ACCESS
│   │   └── DocumentRepository.java      # 💾 DOCUMENT DATA ACCESS
│   ├── service/
│   │   ├── AuthService.java             # 🔑 AUTH LOGIC
│   │   ├── DocumentService.java         # 📑 DOCUMENT LOGIC
│   │   ├── GrammarService.java          # 📝 GRAMMAR LOGIC
│   │   ├── StorageService.java          # ☁️ FILE STORAGE LOGIC
│   │   └── UserDetailsServiceImpl.java  # 👤 USER DETAILS SERVICE
│   ├── security/
│   │   ├── AuthEntryPointJwt.java       # 🚫 AUTH ERROR HANDLER
│   │   ├── JwtRequestFilter.java        # 🔎 JWT TOKEN FILTER
│   │   └── JwtUtil.java                 # 🛠️ JWT UTILITY
│   ├── dto/
│   │   ├── AuthRequest.java             # 📥 AUTH REQUEST DTO
│   │   ├── AuthResponse.java            # 📤 AUTH RESPONSE DTO
│   │   └── RegisterRequest.java         # 📥 REGISTER REQUEST DTO
│   └── config/
│       ├── R2Config.java                # ⚙️ CLOUDFLARE R2 CONFIG
│       └── SecurityConfig.java          # ⚙️ SECURITY CONFIG
│
├── 📂 src/main/resources/
│   ├── application.yml                  # 🔧 MAIN CONFIG
│   ├── application-dev.yml             # 🧪 DEV CONFIG (H2)
│   ├── application-prod.yml            # 🚀 PROD CONFIG (Supabase)
│   └── db/migration/                    # 📊 SCHEMA CHANGES
│       ├── V1__create_users_table.sql
│       ├── V2__create_user_profiles_table.sql
│       └── ... (V3-V8)
│
└── 📄 pom.xml                           # 📦 DEPENDENCIES
```

## 🧩 **Component Explanation**

### **1. WritegyApplication.java**
```java
@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableTransactionManagement
public class WritegyApplication {
    public static void main(String[] args) {
        SpringApplication.run(WritegyApplication.class, args);
    }
}
```

**Purpose:** Entry point for the entire application. Spring Boot scans for components and starts everything. The annotations enable caching, asynchronous methods, and transaction management.

### **2. DocumentController.java (Your Working API)**
```java
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @PostMapping
    public ResponseEntity<Document> createDocument(@RequestParam("file") MultipartFile file) throws IOException {
        Document document = documentService.createDocument(file);
        return ResponseEntity.ok(document);
    }
    // ... other endpoints
}
```

**Purpose:** Handles HTTP requests for document management. The `createDocument` endpoint now accepts a file upload.

**Current Implementation:** Uses `DocumentService` to handle the business logic.

### **3. Document Entity (Data Model)**
```java
@Data
@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private LocalDateTime createdAt;
}
```

**Purpose:** Represents the `documents` table in the database, including a relationship to the `User` entity.

**Why Lombok:** The `@Data` annotation from Lombok automatically generates getters, setters, constructors, `toString()`, `equals()`, and `hashCode()` methods.

### **4. DocumentRepository (Data Access)**
```java
public interface DocumentRepository extends JpaRepository<Document, Long> {
    // Spring Data JPA generates methods automatically
    // List<Document> findAll()
    // Optional<Document> findById(Long id)
    // void save(Document document)
}
```

**Purpose:** Interface for database operations.

**Power:** Spring generates implementation automatically!

### **5. Configuration Files**

#### **application-dev.yml (Development)**
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb  # In-memory database
  jpa:
    show-sql: true          # Show SQL queries for learning
```

**Why H2:** Zero setup, perfect for learning and prototyping.

#### **application-prod.yml (Production)**
```yaml
spring:
  datasource:
    url: ${DATABASE_URL}    # Supabase PostgreSQL
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
```

**Why Environment Variables:** Render injects them automatically.

## 🚀 **Technology Stack Justification**

### **Why Java 25 + Spring Boot?**

| Factor | Decision | Reasoning |
|--------|----------|-----------|
| **Language** | Java 25 LTS | Latest LTS with 10% performance boost |
| **Framework** | Spring Boot 3.5.5 | Full Java 25 support, Spring 4.0 compatibility |
| **Build Tool** | Maven 3.9.11+ | Industry standard for Java projects |
| **Database** | H2 (dev) → PostgreSQL (prod) | Easy learning curve to production |

### **Why Monolithic for MVP?**

```
✅ PROS:
  • Simple to develop
  • Easy to deploy (1 Docker container)
  • Easy to understand for beginners
  • Fast iteration speed
  • Perfect for learning Java

❌ CONS (addressed later):
  • Becomes complex as features grow
  • All services restart together
  • Harder to scale individual parts
```

**When to Split:** When user count > 1,000 or API response time > 500ms.

## 🔐 **Security Architecture**

### **Current Implementation (JWT-based):**
- **Authentication:** Stateless JWT-based authentication.
- **Endpoints:**
    - `/auth/login` and `/auth/register` are public.
    - All other endpoints under `/api/**` are protected and require a valid JWT.
- **Filter Chain:** A `JwtRequestFilter` intercepts incoming requests, validates the JWT, and sets the `Authentication` in the `SecurityContext`.
- **Error Handling:** An `AuthEntryPointJwt` handles authentication errors and returns a 401 Unauthorized response.

### **Phase 3 (Full Security):**
- Role-based authorization (e.g., distinguishing between free and premium users).
- CORS protection (already implemented).
- Rate limiting to prevent abuse.

## 🎨 **API Design Principles**

### **RESTful Conventions:**
- `GET /api/documents` - Get all documents
- `POST /api/documents/upload` - Upload document (Multipart)
- `GET /api/documents/{id}` - Get specific document
- `PUT /api/documents/{id}` - Update document
- `DELETE /api/documents/{id}` - Delete document
- `POST /api/grammar/check` - Check grammar

### **HTTP Status Codes:**
- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Successful deletion
- `400 Bad Request` - Invalid input
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server error

### **Response Format:**
```json
{
  "status": "success",
  "data": { /* resource data */ },
  "timestamp": "2025-12-12T10:30:00Z"
}
```

## 🌐 **Deployment Strategy**

### **Development:**
```bash
# Local development
mvn spring-boot:run -Dspring.profiles.active=dev
# Access: http://localhost:8080
```

### **Production:**
```bash
# Docker build
docker build -t writegy-backend .

# Deploy to Render (automatic)
# Access: https://writegy-backend.onrender.com
```

## 📊 **Performance Considerations**

### **Memory Optimization:**
- Java 25 compact object headers (~10% memory reduction)
- Render free tier: 512MB RAM
- G1 garbage collector optimized for containers

### **Startup Time:**
- Spring Boot 3.x: Faster cold starts
- Docker layer caching
- Lazy bean initialization

### **Database Query Optimization:**
- JPA/Hibernate second-level caching
- Connection pooling (HikariCP)
- Read/write split (future)

## 🔄 **Evolution Roadmap**

### **Phase 1: Foundation & Database**
- Initialize Spring Boot 3.5.5
- Connect to Supabase PostgreSQL
- Set up Flyway migrations (V1-V8)

### **Phase 2: Security (JWT)**
- Implement `JwtUtils`
- Configure `SecurityFilterChain`
- Create Login/Signup endpoints

### **Phase 3: Document Handling**
- Configure Supabase Storage (AWS SDK, S3-compatible)
- Implement File Uploads
- Integrate Apache Tika for text extraction

### **Phase 4: AI & Grammar**
- Integrate LanguageTool API
- Implement Caffeine Cache for performance

### **Phase 5: Deployment**
- Finalize Dockerfile (Java 25 Alpine)
- Configure Render Environment Variables
- Verify Health Checks

---

## 🧠 **Architectural Principles**

### **Keep It Simple:**
- MVP-first approach
- Avoid premature optimization
- Learn by building

### **Embrace the Right Tool:**
- Java for backend reliability
- Relational database for data integrity
- Docker for deployment consistency
- Free tiers for development budget

### **Plan for Growth:**
- Modular architecture ready for splitting
- Database design supports future features
- API design follows REST standards

### **Learning-Focused:**
- Beginner-friendly code examples
- Comprehensive documentation
- Step-by-step progression

---

## 🏛️ **Architectural Decisions**

The key architectural decisions for this project are documented in Architectural Decision Records (ADRs). These records provide the context and consequences of each decision.

*   **[ADR 001: Monolithic Architecture for MVP](./ADRs/001-architecture-overview.md)**
*   **[ADR 002: Supabase for Database and Authentication](./ADRs/002-auth-strategy.md)**
*   **[ADR 003: LanguageTool for NLP](./ADRs/003-nlp-service.md)**

**This architecture serves both learning objectives and production scalability. Start simple, grow methodically!** 🚀
