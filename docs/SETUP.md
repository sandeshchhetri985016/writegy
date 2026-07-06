# 🛠️ Writegy Setup Guide

**One-stop guide for setting up and running Writegy locally or in production.**

## 🎯 Quick Start

```bash
# Start both services
cd backend && mvn spring-boot:run -Dspring.profiles.active=dev  # Backend: http://localhost:8080
cd frontend && npm run dev                                     # Frontend: http://localhost:5173

# Or with Docker
docker-compose up --build
```

---

## 📋 Prerequisites

| Tool | Version | Check Command |
|------|---------|---------------|
| Java | 21+ | `java -version` |
| Maven | 3.9+ | `mvn -version` |
| Node.js | 18+ | `node --version` |
| Git | Any | `git --version` |

### Installation Quick Links

- **Java 21 (Temurin):** https://adoptium.net/temurin/releases/?version=21
- **Maven:** https://maven.apache.org/download.cgi
- **Node.js:** https://nodejs.org/en/download/

---

## 🔧 Local Development Setup

### 1. Clone & Build

```bash
git clone https://github.com/sandeshchhetri985016/writegy.git
cd writegy/backend
mvn clean install
```

### 2. Configuration

Copy `.env.example` to `.env` and configure:

```env
SPRING_PROFILES_ACTIVE=dev
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
OPENROUTER_API_KEY=sk-or-...
```

### 3. Run Services

**Backend:**
```bash
mvn spring-boot:run -Dspring.profiles.active=dev
```

**Frontend:**
```bash
cd ../frontend
npm install
npm run dev
```

### 4. Verify

```bash
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}
```

---

## 🚀 Production Deployment (Render)

### Deploy Button

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Manual Deployment

1. Fork the repository
2. Create Render account and connect your fork
3. Add environment variables in Render dashboard:

| Variable | Description |
|----------|-------------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Service role key |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase settings |
| `DATABASE_URL` | Supabase connection string (auto-injected) |
| `R2_BUCKET_NAME` | `writegy-files` |
| `OPENROUTER_API_KEY` | Your OpenRouter API key |

### Docker Deployment

```bash
docker-compose up --build
```

---

## 🗄️ Database Configuration

Writegy uses **Supabase PostgreSQL** with **Flyway migrations**:

- **11 migrations** (V1-V11) covering users, documents, profiles, preferences
- **Automatic schema updates** on startup
- **H2 in-memory database** for offline development (configure in `application-dev.yml`)

---

## 🔐 Environment Variables

### Required (.env)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key |
| `SUPABASE_JWT_SECRET` | JWT secret for token validation |
| `OPENROUTER_API_KEY` | OpenRouter API key |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `R2_BUCKET_NAME` | `writegy-dev` | Storage bucket |
| `R2_ENDPOINT` | Supabase S3 endpoint | R2/S3 API endpoint |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
mvn test

# Frontend tests
cd frontend
npm test
```

Currently includes: `JwtUtilTest.java` (security), add more controller tests for portfolio.

---

## 📊 Monitoring

- **Health Check:** `GET /actuator/health`
- **Metrics:** `GET /actuator/prometheus`
- **Swagger UI:** `http://localhost:8080/swagger-ui.html`

---

## 🚀 Performance Optimizations

| Setting | Value | Purpose |
|---------|-------|---------|
| Container Support | `-XX:+UseContainerSupport` | Docker memory optimization |
| Max RAM | `-XX:MaxRAMPercentage=75.0` | Use 75% of available RAM |
| GC Algorithm | `-XX:+UseG1GC` | Low-latency garbage collection |
| String Deduplication | `-XX:+UseStringDeduplication` | Reduce memory for duplicate strings |

✅ These settings are preconfigured in `backend/Dockerfile` and `.env`
✅ Optimized for 512MB free tier on Render
✅ No OOM crashes or slow startup times

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 8080 in use | Change `PORT` in `.env` or kill process |
| Supabase connection failed | Check `DATABASE_URL` and network |
| Maven build fails | Run `mvn clean install -DskipTests` |
| Frontend won't start | Run `npm install` first |