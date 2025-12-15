# 📝 Writegy - AI-Powered Writing Assistant

**AI-powered writing assistant built with Java 25 + Spring Boot, deployed on Render + Supabase (100% free tier).**

[![Java 25](https://img.shields.io/badge/Java-25-orange.svg)](https://openjdk.org/projects/jdk/25/)
[![Spring Boot 3.5.5](https://img.shields.io/badge/Spring_Boot-3.5.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Render](https://img.shields.io/badge/Hosted_on-Render-blue.svg)](https://render.com)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

## 🚀 **Quick Start (5 Minutes)**

### Prerequisites
- Java 25 (Temurin distribution)
- Maven 3.9+
- Git

### 1. Clone & Run
```bash
git clone https://github.com/sandeshchhetri985016/writegy.git
cd writegy/backend

# Build and run (uses H2 in-memory database)
mvn clean install
mvn spring-boot:run -Dspring.profiles.active=dev
```

### 2. Test Your API
```bash
# Upload a document (hybrid approach) - file goes to S3, content goes to DB
curl -X POST http://localhost:8080/api/documents \
  -F "file=@document.pdf" \
  -F "title=My First Doc" \
  -F "content=This is the pre-extracted text from the PDF..."

# Get all documents
curl http://localhost:8080/api/documents
```

**🎉 You now have a working Java 25 backend!**

## 🏗️ **Architecture**

### **Current MVP (Monolithic Backend)**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React         │    │   Spring Boot   │    │   H2/Postgre    │
│   Frontend      │◄──►│   Java 25       │◄──►│   Database      │
│   (Future)      │    │   REST API      │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Free Tier Services**
- **Backend**: Render (750 hrs/month free)
- **Database**: Supabase (500MB free forever)
- **File Storage**: Cloudflare R2 (10GB free)
- **Grammar Check**: LanguageTool API (free tier)

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

## 📁 **Project Structure (MVP Focus)**

```
writegy/
├── 📂 backend/                          # 🚀 YOUR FOCUS AREA
│   ├── 📄 pom.xml                       # Maven dependencies
│   ├── 📄 Dockerfile                    # Java 25 container
│   ├── 📂 src/main/java/com/writegy/
│   │   ├── 📄 WritegyApplication.java   # Spring Boot starter
│   │   └── 📂 controller/
│   │       └── 📄 DocumentController.java # REST endpoints
│   └── 📂 src/main/resources/
│       ├── 📄 application.yml           # Config
│       ├── 📄 application-dev.yml       # Dev config (H2)
│       └── 📂 db/migration/             # Database schema
├── 📂 docs/                             # Documentation
│   ├── 📄 DEPLOYMENT-GUIDE.md           # Deploy to Render
│   ├── 📄 API-REFERENCE.md              # API endpoints
│   └── 📄 DEVELOPMENT-SETUP.md          # Getting started
├── 📂 archive/                          # Experiments (ignore for MVP)
└── 📂 frontend/                         # React UI (future)
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
# Backend only (current focus)
cd backend

# Clean build
mvn clean install

# Run locally
mvn spring-boot:run -Dspring.profiles.active=dev

# Run tests
mvn test

# Build Docker image
docker build -t writegy-backend .

# Run in Docker
docker run -p 8080:8080 writegy-backend
```

## 📡 **API Endpoints (Working Now)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/documents` | Get all documents |
| `POST` | `/api/documents/upload` | Upload document (PDF/DOCX) |
| `GET` | `/api/documents/{id}` | Get document by ID |
| `DELETE` | `/api/documents/{id}` | Delete document |
| `POST` | `/api/grammar/check` | Check grammar |

### **Example API Usage:**
```bash
# Upload document
curl -X POST http://localhost:8080/api/documents/upload \
  -F "file=@essay.txt" \
  -F "title=History Essay"

# Response: {"id":1,"title":"History Essay","extractedText":"...","createdAt":"..."}
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

## 🎯 **Current MVP Status**

- ✅ **Java 25 + Spring Boot 3.5.5** working perfectly
- ✅ **Document CRUD operations** via REST API
- ✅ **In-memory database** (H2) for easy development
- ✅ **Docker containerization** ready for production
- ✅ **Deployed on Render** (free hosting)
- 🚧 **Authentication** (next phase)
- 🚧 **Frontend UI** (React, next phase)
- 🚧 **Database persistence** (Supabase, next phase)

## 📚 **Learning Path**

### **Beginner (Current You)**
1. ✅ Understand `WritegyApplication.java` (Spring Boot starter)
2. ✅ Learn REST APIs with `DocumentController.java`
3. ✅ Master `application-dev.yml` configuration
4. ✅ Deploy to Render using Docker

### **Intermediate (Next)**
1. 🏗️ Add user authentication (Supabase Auth)
2. 🎨 Create React frontend
3. 💾 Connect to PostgreSQL (Supabase)
4. 🔍 Add AI-powered features

### **Advanced (Future)**
1. ⚡ Performance optimization
2. 🏛️ Microservices architecture
3. ☁️ Cloud-native features
4. 🤖 Advanced AI integration

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
