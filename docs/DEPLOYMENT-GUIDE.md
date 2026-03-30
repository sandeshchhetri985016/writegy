# Writegy Deployment Guide

## Overview

This guide explains how to deploy Writegy using **Render + Supabase** - our unified free platform stack for production.

## Architecture Overview

- **Backend**: Render (Docker deployment, Java 21 + Spring Boot 3.4.4)
- **Database**: Supabase PostgreSQL 16 (managed, 500MB free)
- **File Storage**: Supabase Storage (1GB free, S3-compatible)
- **Authentication**: Supabase JWT with OAuth2 Resource Server
- **Security**: Rate limiting, CORS, file validation
- **Memory**: Optimized for 512MB free tier (70MB max usage)

## Prerequisites

1. GitHub account with your Writegy repository
2. Supabase account (free)
3. Render account (free)
4. Java 21 JDK (for local development)
5. Maven 3.9+ (for building)
6. Node.js 18+ (for frontend development)

## Step 0: Configure Supabase

### Create Supabase Project

1. Go to [Supabase.com](https://supabase.com) and sign up
2. Create a new project (Free tier is perfect)
3. Note your project URL and anon key

### Run Database Migrations

Connect to Supabase dashboard and run these SQL migrations in order:

- `backend/src/main/resources/db/migration/V1__create_users_table.sql`
- `backend/src/main/resources/db/migration/V2__create_user_profiles_table.sql`
- `backend/src/main/resources/db/migration/V3__create_user_preferences_table.sql`
- `backend/src/main/resources/db/migration/V4__create_documents_table.sql`
- `backend/src/main/resources/db/migration/V5__create_document_versions_table.sql`
- `backend/src/main/resources/db/migration/V6__create_user_events_table.sql`
- `backend/src/main/resources/db/migration/V7__create_writing_metrics_table.sql`
- `backend/src/main/resources/db/migration/V8__create_indexes.sql`
- `backend/src/main/resources/db/migration/V9__add_document_hierarchy.sql`

## Step 1: Deploy Backend to Render

### Create Render Service

1. Sign up at [Render.com](https://render.com) (Free tier available)
2. Click "New" → "Web Service"
3. Connect your GitHub repository (sandeshchhetri985016/writegy)
4. Configure service:
   - **Name**: `writegy`
   - **Region**: Closest to your users
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Dockerfile**: `backend/Dockerfile` (default)
   - **Environment**: `backend/.env.example` (for reference)

### Environment Variables

Add these environment variables in Render:

```bash
# Profile Configuration
SPRING_PROFILES_ACTIVE=prod

# Database Configuration (from Supabase)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=[your-supabase-password]

# Supabase Configuration
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_KEY=[your-anon-key]
SUPABASE_JWT_SECRET=[optional-jwt-secret]

# File Storage (Supabase Storage - S3-compatible API)
R2_ACCESS_KEY=[your-supabase-service-role-key]
R2_SECRET_KEY=[your-supabase-service-role-key]
R2_ENDPOINT=https://[your-project].supabase.co/storage/v1/s3
R2_BUCKET_NAME=writegy-files

# AI Grammar Checking (OpenRouter API - Required for grammar features)
OPENROUTER_API_KEY=[your-openrouter-api-key]
OPENROUTER_MODEL=microsoft/wizardlm-2-8x22b  # Recommended model
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Performance Optimization
JAVA_OPTS=-XX:+UseG1GC -XX:MaxRAMPercentage=70.0 -XX:+UseStringDeduplication

# Render Configuration
PORT=8080  # Render will set this automatically
```

### Deploy

- Click "Create Web Service" - Render will build and deploy automatically
- Your API will be available at `https://writegy.onrender.com`

### Post-Deployment Verification

After deployment, verify your application is running correctly:

```bash
# Check application health
curl https://writegy.onrender.com/actuator/health

# Test basic API endpoint
curl https://writegy.onrender.com/api/documents

# Check logs in Render dashboard for any errors
```

**Expected Results:**
- Health check returns `{"status":"UP"}`
- API endpoints respond with JSON data
- No errors in Render logs

## Step 2: Verify Deployment

Test your deployment:

```bash
# Check application health
curl https://writegy.onrender.com/actuator/health

# Test basic API endpoint
curl https://writegy.onrender.com/api/documents

# Verify file storage is working
curl https://writegy.onrender.com/api/documents/1
```

## Step 3: Frontend Integration

### Deploy Frontend to Vercel (Recommended)

1. Sign up at [Vercel.com](https://vercel.com) (Free tier available)
2. Connect your GitHub repository
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables: Add your backend URL

### Alternative: Deploy Frontend to Render

1. Create new Web Service in Render
2. Connect your GitHub repository
3. Configure:
   - **Name**: `writegy-frontend`
   - **Runtime**: `Static`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

### CORS Configuration

Update the CORS settings in your backend Render environment variables:

```bash
FRONTEND_URL=https://your-frontend-domain.onrender.com
```

## Step 4: Local Development

### Option A: Direct Spring Boot (Backend)

```bash
cd backend
mvn spring-boot:run -Dspring.profiles.active=dev
```

### Option B: Direct Node.js (Frontend)

```bash
cd frontend
npm run dev
```

### Option C: Docker Compose (Full Stack)

Create a `docker-compose.yml` file for local development:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
    volumes:
      - ./backend/src/main/resources:/app/src/main/resources
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/package.json:/app/package.json
```

## Monitoring & Debugging

### Render Dashboard

- Check **Logs** tab for detailed application logs
- Monitor **Metrics** tab for performance
- View **Events** tab for deployment history

### Supabase Dashboard

- Monitor database queries and performance
- Check user authentication flows
- View real-time metrics

### Vercel Dashboard (Frontend)

- Check build logs and performance
- Monitor frontend errors
- View real-time analytics

## Free Tiers Usage

| Service | Free Limits | Cost |
|---------|-------------|------|
| Render Backend | 750 hrs/month | $0 |
| Render Frontend | 750 hrs/month | $0 |
| Supabase | 500MB data, 50MB bandwidth, 1GB storage | $0 |
| Vercel | Unlimited bandwidth, 100GB storage | $0 |
| LanguageTool | 20 requests/hour | $0 |
| Java 25 JDK | Unlimited usage | $0 |
| Maven 3.9+ | Unlimited usage | $0 |
| Node.js 18+ | Unlimited usage | $0 |

## Scaling Up

When you need to grow:

### Render Paid Plan
- Increase from $7/month for 2GB RAM, 4 CPU
- Enable auto-scaling

### Supabase Pro
- $25/month for 1GB DB, 10GB bandwidth, 100GB storage
- Additional features

### Vercel Pro
- $20/month for advanced features
- Custom domains
- Analytics

## 🔐 Security Verification

### API Key Protection Check
Before deployment, verify that sensitive API keys are properly protected:

```bash
# Check that .env files are not tracked in git
git ls-files | grep "\.env$" || echo "✅ No .env files in git - API keys are protected"

# Verify .gitignore excludes .env files
grep -q "\.env" .gitignore && echo "✅ .gitignore properly excludes .env files" || echo "❌ .env not excluded"
```

### Environment Variables Setup
Ensure all sensitive configuration is set as environment variables in Render/Vercel:

**Required Environment Variables:**
```bash
# Database (from Supabase)
DATABASE_URL=jdbc:postgresql://...
DATABASE_USERNAME=postgres.[project-ref]
DATABASE_PASSWORD=[your-password]

# Authentication
SUPABASE_URL=https://[project].supabase.co
SUPABASE_KEY=[anon-key]
SUPABASE_JWT_SECRET=[jwt-secret]

# AI Services
OPENROUTER_API_KEY=[your-key]
OPENROUTER_MODEL=microsoft/wizardlm-2-8x22b  # Recommended model
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# File Storage
R2_ACCESS_KEY=[supabase-service-role-key]
R2_SECRET_KEY=[supabase-service-role-key]
R2_ENDPOINT=https://[project].supabase.co/storage/v1/s3
R2_BUCKET_NAME=writegy-files

# Performance Optimization
JAVA_OPTS=-XX:+UseG1GC -XX:MaxRAMPercentage=70.0 -XX:+UseStringDeduplication

# Frontend Configuration
VITE_API_URL=https://writegy-backend.onrender.com
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

**Never commit these values to git!**

## Troubleshooting

### Common Issues

**Build Fails**: Check Java 25 compatibility in Dockerfile
**Database Connection**: Verify Supabase connection string
**Port Issues**: Render sets PORT automatically, don't override
**CORS Errors**: Check FRONTEND_URL environment variable
**API Key Errors**: Verify environment variables are set in Render/Vercel dashboard

### Performance Issues

**Slow Response Times**:
- Check Java memory settings in Render environment variables
- Verify database connection pool size
- Monitor CPU usage in Render dashboard

**High Memory Usage**:
- Adjust `JAVA_OPTS` memory settings
- Check for memory leaks in application logs
- Consider upgrading to paid plan if needed

### Security Issues

**Authentication Failures**:
- Verify JWT secret matches Supabase configuration
- Check CORS settings for frontend domain
- Verify API key protection in environment variables

**File Upload Issues**:
- Check file size limits in configuration
- Verify storage bucket permissions
- Test file type validation

Need help? Check the logs in Render/Vercel dashboard or try running locally with `spring.profiles.active=dev`.

## Monitoring & Debugging

### Render Dashboard

- Check **Logs** tab for detailed application logs
- Monitor **Metrics** tab for performance
- View **Events** tab for deployment history

### Supabase Dashboard

- Monitor database queries and performance
- Check user authentication flows
- View real-time metrics


## Free Tiers Usage

| Service | Free Limits | Cost |
|---------|-------------|------|
| Render Backend | 750 hrs/month | $0 |
| Render Frontend | 750 hrs/month | $0 |
| Supabase | 500MB data, 50MB bandwidth, 1GB storage | $0 |
| Vercel | Unlimited bandwidth, 100GB storage | $0 |
| LanguageTool | 20 requests/hour | $0 |
| Java 25 JDK | Unlimited usage | $0 |
| Maven 3.9+ | Unlimited usage | $0 |
| Node.js 18+ | Unlimited usage | $0 |

## Scaling Up

When you need to grow:

### Render Paid Plan
- Increase from $7/month for 2GB RAM, 4 CPU
- Enable auto-scaling

### Supabase Pro
- $25/month for 1GB DB, 10GB bandwidth, 100GB storage
- Additional features

## 🔐 Security Verification

### API Key Protection Check
Before deployment, verify that sensitive API keys are properly protected:

```bash
# Check that .env files are not tracked in git
git ls-files | grep "\.env$" || echo "✅ No .env files in git - API keys are protected"

# Verify .gitignore excludes .env files
grep -q "\.env" .gitignore && echo "✅ .gitignore properly excludes .env files" || echo "❌ .env not excluded"
```

### Environment Variables Setup
Ensure all sensitive configuration is set as environment variables in Render/Vercel:

**Required Environment Variables:**
```bash
# Database (from Supabase)
DATABASE_URL=jdbc:postgresql://...
DATABASE_USERNAME=postgres.[project-ref]
DATABASE_PASSWORD=[your-password]

# Authentication
SUPABASE_URL=https://[project].supabase.co
SUPABASE_KEY=[anon-key]
SUPABASE_JWT_SECRET=[jwt-secret]

# AI Services
OPENROUTER_API_KEY=[your-key]
OPENROUTER_MODEL=microsoft/wizardlm-2-8x22b  # Recommended model
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# File Storage
R2_ACCESS_KEY=[supabase-service-role-key]
R2_SECRET_KEY=[supabase-service-role-key]
R2_ENDPOINT=https://[project].supabase.co/storage/v1/s3
R2_BUCKET_NAME=writegy-files

# Performance Optimization
JAVA_OPTS=-XX:+UseG1GC -XX:MaxRAMPercentage=70.0 -XX:+UseStringDeduplication

# Frontend Configuration
VITE_API_URL=https://writegy-backend.onrender.com
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

**Never commit these values to git!**

## Troubleshooting

### Common Issues

**Build Fails**: Check Java 25 compatibility in Dockerfile
**Database Connection**: Verify Supabase connection string
**Port Issues**: Render sets PORT automatically, don't override
**CORS Errors**: Check FRONTEND_URL environment variable
**API Key Errors**: Verify environment variables are set in Render dashboard

Need help? Check the logs in Render dashboard or try running locally with `spring.profiles.active=dev`.
