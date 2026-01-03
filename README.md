# 📝 Writegy - Complete AI-Powered Writing Assistant

**Full-featured SaaS writing platform with React 18 + Spring Boot 3.5, deployed on Render + Supabase (100% free tier). Features AI grammar checking, rich text editing, document management, and seamless file uploads.**

[![Java 21](https://img.shields.io/badge/Java-21/25-orange.svg)](https://openjdk.org/)
[![Spring Boot 3.5.5](https://img.shields.io/badge/Spring_Boot-3.5.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React 18](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Storage-green.svg)](https://supabase.com)
[![Render](https://img.shields.io/badge/Hosted_on-Render-blue.svg)](https://render.com)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

## 🚀 **Quick Start (10 Minutes - Full Stack)**

### Prerequisites
- Java 25 (Temurin distribution) - for development
- Node.js 18+ (for React frontend)
- Maven 3.9+
- Git

### 1. Clone & Setup Backend
```bash
git clone https://github.com/sandeshchhetri985016/writegy.git
cd writegy

# Set up environment variables
cp .env.sample .env  # Configure your Supabase keys

# Start the backend (Java 25 locally, Java 21 in Docker if containerized)
cd backend
mvn clean install
mvn spring-boot:run -Dspring.profiles.active=dev
```

### 2. Setup & Start Frontend
```bash
# In a new terminal window - setup frontend
cd writegy/frontend
npm install

# Configure Supabase for frontend
cp .env.example .env
# Add your Supabase keys to frontend/.env

# Start React development server
npm run dev
```

### 3. Test the Full Application

**Frontend:** http://localhost:5173 (React app)
**Backend:** http://localhost:8080 (Spring Boot API)

#### Test User Journey:
1. ✅ Open http://localhost:5173
2. ✅ Register with email (Supabase auth)
3. ✅ Create a new document
4. ✅ Write text and see grammar suggestions
5. ✅ Upload file (file + extracted text)
6. ✅ View document history

### 4. API Testing (Optional)
```bash
# In another terminal:
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}

curl http://localhost:8080/api/documents
# Expected: [] (empty, or your documents if logged in)
```

**🎉 Complete SaaS application running locally!**

## 🏗️ **Architecture**

### **Complete SaaS Application**
```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│     React 18        │    │   Spring Boot       │    │   Supabase PG       │    │  Supabase Storage   │
│   Frontend SPA      │◄──►│   Java 21/25        │◄──►│   500MB Free        │◄──►│   1GB Files         │
│                     │    │   JWT Security      │    │                     │    │   S3-Compatible     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘    └─────────────────────┘
         │                           │                           │                           │
         ▼                           ▼                           ▼                           ▼
   📱 User Interface           ⚙️ REST API (20MB mem)         💾 Document Storage          📁 File Storage
   🔐 Supabase Auth            🛡️ Rate Limiting              🔄 Auto Migrations         📊 CDN Delivery
   ✍️ Rich Text Editor         📊 Health Monitoring           🎯 Enterprise RL S         🚀 Global Access
```

### **Hybrid Document Processing**
```
Frontend Processing → Backend Storage → Cloud Persistence

1. User uploads PDF → React extracts text client-side
2. File + text sent to backend API (multipart/form-data)
3. Spring Boot validates + stores in Supabase Storage
4. Text content saved to PostgreSQL
5. Grammar AI processes content on-demand
6. All data persists across sessions
```

### **Free Tier Services**
- ✅ **Backend**: Render (750 hrs/month free) - Web Services
- ✅ **Database**: Supabase PostgreSQL (500MB free forever)
- ✅ **File Storage**: Supabase Storage (1GB free) - S3-compatible
- ✅ **Authentication**: Supabase Auth (unlimited users)
- ✅ **Grammar Check**: LanguageTool API (rate limited)

## 📖 **What This Project Teaches**

### **Java 25 Features**
- Modern JVM with 10% performance boost
- Structured concurrency
- Enhanced virtual threads
- Compact object headers

### **Spring Boot Patterns**
- REST API design
- Dependency injection
- Configuration management
- JPA/Hibernate
- Flyway migrations

## 📁 **Complete Project Structure**

```
writegy/
├── 📂 backend/                                    # 🚀 Spring Boot Backend
│   ├── 📄 pom.xml                                # Maven dependencies
│   ├── 📄 Dockerfile                             # Java 21 container build
│   ├── 📂 src/main/java/com/writegy/
│   │   ├── 📄 WritegyApplication.java            # ✨ Spring Boot launcher
│   │   ├── 📂 config/                            # ⚙️ Configuration classes
│   │   ├── 📂 controller/                        # 🌐 REST API endpoints
│   │   ├── 📂 service/                           # 🔧 Business logic
│   │   ├── 📂 repository/                        # 💾 Data access layer
│   │   ├── 📂 entity/                            # 🎯 JPA entities
│   │   └── 📂 dto/                               # 📋 Data transfer objects
│   └── 📂 src/main/resources/                    # 🗂️ Configuration files
│       ├── 📄 application.yml                    # Main config
│       ├── 📄 application-dev.yml               # Development (H2)
│       ├── 📄 application-prod.yml              # Production (Supabase)
│       └── 📂 db/migration/                      # Flyway schema migrations
│
├── 📂 frontend/                                   # 🎨 React Frontend (Complete!)
│   ├── 📄 package.json                           # NPM dependencies
│   ├── 📄 vite.config.js                         # Vite build config
│   ├── 📂 src/
│   │   ├── 📄 App.jsx                            # Main React app
│   │   ├── 📂 features/                          # Feature modules
│   │   │   ├── 📂 auth/                         # 🔐 Authentication (Login/Register)
│   │   │   ├── 📂 dashboard/                    # 📊 Document management
│   │   │   └── 📂 editor/                       # ✍️ Text editor + grammar
│   │   ├── 📂 lib/                             # 🔧 Utilities
│   │   │   ├── 📄 api.js                        # ✨ Axios + Supabase API
│   │   │   └── 📄 supabase.js                   # Supabase client
│   │   ├── 📂 contexts/                         # React contexts
│   │   └── 📂 components/                       # Reusable components
│   └── 📂 public/                               # Static assets
│
├── 📂 docs/                                       # 📚 Documentation
│   ├── 📄 README.md                              # This file
│   ├── 📄 ARCHITECTURE.md                        # System architecture
│   ├── 📄 API-REFERENCE.md                       # Complete API guide
│   ├── 📄 DEVELOPMENT-SETUP.md                   # Setup instructions
│   └── 📄 DEPLOYMENT-GUIDE.md                    # Production deployment
│
├── 📄 .env                                        # 🔑 Environment variables
├── 📄 .env.sample                                # 📋 Environment template
└── 📄 docker-compose.yml                         # 🐳 Multi-service orchestration
```

### **Files You Need to Know (Java Beginner)**

| File | Purpose | Difficulty |
|------|---------|------------|
| `WritegyApplication.java` | Spring Boot app starter | ⭐ |
| `DocumentController.java` | REST API endpoints | ⭐⭐ |
| `application-dev.yml` | Local database config | ⭐ |
| `pom.xml` | Project dependencies | ⭐⭐ |

## 🛠️ **Development Commands**

```bash
# Full Stack Development Setup
cd writegy

# Backend Setup & Run
cd backend
mvn clean install
mvn spring-boot:run -Dspring.profiles.active=dev  # http://localhost:8080

# Frontend Setup & Run (New Terminal)
cd ../frontend
npm install
npm run dev  # http://localhost:5173

# Build Commands
# Backend Docker build
docker build -t writegy-backend ./backend
docker run -p 8080:8080 writegy-backend

# Frontend production build
npm run build  # Creates dist/ folder
```

### **Environment Setup:**
```bash
# Root directory
cp .env.sample .env  # Configure Supabase keys

# Frontend directory
cd frontend
cp .env.example .env  # Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

## 📡 **Complete API Reference**

### **Authentication Endpoints:**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/sync` | Sync Supabase user to backend | JWT required |
| `GET` | `/auth/me` | Get current user info | JWT required |

### **Document Management:**
| Method | Endpoint | Description | Request Format |
|--------|----------|-------------|----------------|
| `GET` | `/api/documents` | List all documents | - |
| `POST` | `/api/documents` | **HYBRID UPLOAD** (file + text) | `multipart/form-data` |
| `GET` | `/api/documents/{id}` | Get specific document | - |
| `PUT` | `/api/documents/{id}` | Update document | JSON |
| `DELETE` | `/api/documents/{id}` | Delete document | - |

### **AI Features:**
| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| `POST` | `/api/grammar/check` | Grammar & style suggestions | 20/hour per user |

### **Monitoring:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/actuator/health` | Application health status |
| `GET` | `/actuator/info` | Application metadata |
| `GET` | `/actuator/metrics` | Performance metrics |

### **Hybrid Upload API Example:**
```bash
# Complete file upload with text extraction
curl -X POST http://localhost:8080/api/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.pdf" \
  -F "title=Research Paper" \
  -F "content=This is the extracted text from the frontend..."
```

**Response:**
```json
{
  "id": 1,
  "title": "Research Paper",
  "content": "This is the extracted text from the frontend...",
  "createdAt": "2024-12-15T11:50:00Z"
}
```

## 🚀 **Deployment**

Deploy to **Render** (free for Java apps):

```bash
# 1. Push to GitHub (your repo)
git add .
git commit -m "Working Writegy backend"
git push origin main

# 2. Deploy on Render.com
# Follow: docs/DEPLOYMENT-GUIDE.md
```

Your API will be live at: `https://writegy-backend.onrender.com`

## ✨ **Latest Features & Improvements**

### **🚀 Advanced Auto-Save System**
- ✅ **Debounced Auto-Save** (2-second delay after typing stops)
- ✅ **Smart Timing** - Saves when you pause, not while typing
- ✅ **Visual Feedback** - Shows "Saving..." and "Draft saved" status
- ✅ **Background Processing** - Doesn't interrupt writing flow

### **📝 Rich Text Editor with AI**
- ✅ **Formatting Toolbar** - Bold, italic, underline, lists, quotes
- ✅ **Inline Grammar Panel** - Collapsible suggestions sidebar
- ✅ **AI-Powered Analysis** - Spelling, grammar, style suggestions
- ✅ **Real-time Feedback** - Immediate analysis with detailed reports

### **📊 Smart Document Management**
- ✅ **Accurate Word Counts** - Backend calculation with character stats
- ✅ **Legacy Data Migration** - Auto-updates old documents
- ✅ **Document Statistics** - Words, characters, creation dates
- ✅ **File Upload Support** - PDF/DOCX text extraction

### **🎨 Professional UI/UX**
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **Toast Notifications** - User-friendly success/error messages
- ✅ **Loading States** - Better user feedback throughout
- ✅ **Error Handling** - Comprehensive error management

## 🎯 **Complete SaaS Application Status**

- ✅ **Full-Stack Application** running with React 18 + Spring Boot 3.5
- ✅ **Supabase Authentication** with JWT security (unlimited users)
- ✅ **PostgreSQL Database** with 500MB free storage forever
- ✅ **Supabase Storage** 1GB file uploads (S3-compatible)
- ✅ **Advanced Auto-Save** with debounced timing (2s delay)
- ✅ **AI Grammar Checking** with inline suggestions panel
- ✅ **Rich Text Formatting** toolbar with professional features
- ✅ **Hybrid Document Processing** (frontend extracts, backend stores)
- ✅ **Docker Deployment** Java 21 optimized containers
- ✅ **Production Ready** on Render with monitoring
- ✅ **Enterprise Security** Rate limiting + error handling
- ✅ **Professional UI** Tailwind CSS + responsive design

## 📚 **Development Learning Path**

### **Beginner (Java/Spring Boot Focus)**
1. ✅ **Spring Boot Fundamentals** - `WritegyApplication.java` starter
2. ✅ **REST API Design** - `DocumentController.java` endpoints
3. ✅ **Database Configuration** - JPA/Hibernate with migrations
4. ✅ **Enterprise Patterns** - Dependency injection, exception handling
5. ✅ **Docker & Deployment** - Containerization & cloud hosting

### **Intermediate (Full-Stack Development)**
1. ✅ **React + TypeScript** - Modern frontend development
2. ✅ **Supabase Integration** - Auth + Database + Storage
3. ✅ **Hybrid Architecture** - Frontend processing + backend storage
4. ✅ **API Design** - RESTful endpoints with JWT security
5. ✅ **Production Deployment** - Multi-service orchestration

### **Advanced Features (Already Implemented)**
1. ✅ **Performance Optimization** - 20MB memory usage, JVM tuning
2. ✅ **Cloud-Native Features** - Global CDN, auto-scaling storage
3. ✅ **Enterprise Security** - Rate limiting, CORS, validation
4. ✅ **AI Integration** - Grammar checking, content processing
5. ✅ **Professional Documentation** - Complete API references

### **🔥 What This Teaches You:**

**Backend Excellence:**
- Java 21/25 development vs Docker deployment
- Enterprise Spring Boot patterns (Config, Security, Metrics)
- Hybrid file processing architecture
- Database design with migrations
- Production monitoring & health checks

**Frontend Mastery:**
- React SPA development with hooks
- Supabase Auth integration
- Responsive UI with TailwindCSS
- File processing in browser
- Real-time API communication

**Full-Stack Architecture:**
- Microservices-like separation
- Cloud service integration (Auth + DB + Storage)
- Production deployment pipelines
- Performance optimization
- Free-tier SaaS economics

## 🤝 **Contributing**

This is a **student project** - contributions welcome! Focus on:
- Simple, readable Java code
- Good documentation
- Beginner-friendly patterns
- Free tier compatibility

## 📄 **License**

MIT License - see [LICENSE](./LICENSE) for details.

## 🙋 **Need Help?**

- 📖 **Beginner?** Start with `docs/DEVELOPMENT-SETUP.md`
- 🚀 **Ready to Deploy?** Read `docs/DEPLOYMENT-GUIDE.md`
- 🏗️ **API Documentation:** See `docs/API-REFERENCE.md`
- 💬 **Questions?** Check issues or context.md

---

**Happy coding! 🎉** Learn Java, build something useful, deploy for free!
