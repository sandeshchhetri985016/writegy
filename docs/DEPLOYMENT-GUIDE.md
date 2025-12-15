# Writegy Deployment Guide

## Overview

This guide explains how to deploy Writegy using **Render + Supabase + Cloudflare** - our chosen free platform stack for production.

## Architecture Overview

- **Backend**: Render (Docker deployment, Java 25 + Spring Boot)
- **Database**: Supabase PostgreSQL (managed)
- **File Storage**: Cloudflare R2 (10GB free)
- **Authentication**: Supabase JWT with OAuth2 Resource Server
- **Security**: Rate limiting, CORS, file validation
- **Memory**: Optimized for 512MB free tier (70MB max usage)

## Prerequisites

1. GitHub account with your Writegy repository
2. Supabase account (free)
3. Cloudflare account (optional, for file storage)
4. Render account (free)

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

# Cloudflare R2 (Optional - for file storage)
R2_ACCESS_KEY=[your-access-key]
R2_SECRET_KEY=[your-secret-key]
R2_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
R2_BUCKET_NAME=writegy-prod

# LanguageTool API (Optional - grammar checking)
LANGUAGETOOL_API_KEY=[your-api-key]

# Render Configuration
PORT=8080  # Render will set this automatically
```

### Deploy

- Click "Create Web Service" - Render will build and deploy automatically
- Your API will be available at `https://writegy.onrender.com`

## Step 2: File Storage Setup (Cloudflare R2)

Only needed if you implement file uploads:

1. Create R2 bucket at [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Get Access Keys (API Tokens)
3. Set variables: `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_ENDPOINT`, `R2_BUCKET_NAME`

## Step 3: Verify Deployment

Test your deployment:

```bash
# Get all documents
curl https://writegy.onrender.com/api/documents

# Health check
curl https://writegy.onrender.com/actuator/health
```

## Step 4: CORS Configuration

Update the CORS settings in your Render environment variables:

```bash
FRONTEND_URL=https://your-frontend-domain.onrender.com
```

## Local Development

### Option A: Direct Spring Boot

```bash
cd backend
mvn spring-boot:run -Dspring.profiles.active=dev
```

### Option B: Docker Compose (Future)

Docker Compose will be configured for local development with services like:
- H2 database (instead of Supabase)
- Fake SMTP server
- LanguageTool local instance

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
| Render | 750 hrs/month | $0 |
| Supabase | 500MB data, 50MB bandwidth | $0 |
| Cloudflare R2 | 10GB storage, 1GB bandwidth | $0 |
| LanguageTool | Free tier available | $0 |

## Scaling Up

When you need to grow:

### Render Paid Plan
- Increase from $7/month for 2GB RAM, 4 CPU
- Enable auto-scaling

### Supabase Pro
- $25/month for 1GB DB, 10GB bandwidth
- Additional features

### Cloudflare R2
- Pay per GB ($0.015/GB month)

## Troubleshooting

### Common Issues

**Build Fails**: Check Java 25 compatibility in Dockerfile
**Database Connection**: Verify Supabase connection string
**Port Issues**: Render sets PORT automatically, don't override
**CORS Errors**: Check FRONTEND_URL environment variable

Need help? Check the logs in Render dashboard or try running locally with `spring.profiles.active=dev`.
