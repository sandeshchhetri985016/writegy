# 📁 Writegy - Complete File Structure

> **Last Updated:** 2026-03-24  
> **Total Files:** 150+ files documented  
> **Purpose:** Complete reference of every file in the repository with descriptions

---

## 📑 Table of Contents

1. [Root Directory](#root-directory)
2. [Backend (Spring Boot)](#backend-spring-boot)
3. [Frontend (React)](#frontend-react)
4. [Documentation](#documentation)
5. [Infrastructure](#infrastructure)
6. [Scripts](#scripts)
7. [Archive (Experiments)](#archive-experiments)

---

## Root Directory

```
writegy/
├── .env.sample [Environment variable template with placeholder values for Supabase, OpenRouter, and R2 configuration]
├── .gitattributes [Git attributes configuration for line endings and binary file handling]
├── .gitignore [Git ignore rules for node_modules, target, .env files, IDE files, and build artifacts]
├── context.md [Project context and notes file for development reference]
├── CorsConfig.java [Duplicate CORS configuration class - appears to be misplaced at root level]
├── docker-compose.yml [Docker Compose configuration for orchestrating backend and frontend services]
├── LICENSE [MIT License file for the project]
├── Makefile [Make commands for common development tasks like build, run, test]
├── package-lock.json [NPM lock file for dependency version pinning at root level]
├── README.md [Main project documentation with quick start guide, architecture overview, and API reference]
├── render.yaml [Render.com deployment configuration for backend service]
├── WRITEGY_ANALYSIS_REPORT.md [Comprehensive technical analysis report of the entire codebase]
```

---

## Backend (Spring Boot)

### Backend Root Files

```
backend/
├── .dockerignore [Docker ignore file excluding node_modules, .git, and unnecessary files from Docker build]
├── Dockerfile [Multi-stage Docker build configuration for Java 21 Spring Boot application]
├── package-lock.json [NPM lock file - appears misplaced, backend is Java-based]
├── pom.xml [Maven project configuration with Spring Boot 3.5.5, Java 21, JPA, Security, AWS SDK dependencies]
├── run.ps1 [PowerShell script to run the Spring Boot application with dev profile]
```

### Backend Source Code

```
backend/src/main/java/com/writegy/
├── WritegyApplication.java [Main Spring Boot application entry point with @SpringBootApplication, enables caching, async, and transaction management]
```

#### Configuration Classes (`config/`)

```
config/
├── CorsConfig.java [CORS configuration allowing localhost origins and Supabase domain, sets allowed methods and headers]
├── DatabaseConfig.java [Database configuration class for datasource and connection settings]
├── GlobalExceptionHandler.java [Global exception handler for REST API errors, handles validation, runtime, and generic exceptions]
├── JpaConfig.java [JPA configuration enabling JPA auditing for automatic createdAt/updatedAt timestamps]
├── JwtAuthenticationFilter.java [JWT filter that validates Supabase JWT tokens from Authorization header, extracts user info]
├── R2Config.java [Cloudflare R2 (S3-compatible) storage configuration using AWS SDK v2]
├── RateLimitConfig.java [Rate limiting configuration using Bucket4j for API throttling]
├── RateLimitFilter.java [HTTP filter implementing per-user rate limiting on API endpoints]
├── SecurityConfig.java [Spring Security configuration defining public/protected endpoints, CORS, CSRF settings]
```

#### Controllers (`controller/`)

```
controller/
├── AuthController.java [REST controller for authentication endpoints: POST /auth/sync and GET /auth/me]
├── DocumentController.java [REST controller for document CRUD operations: GET/POST/PUT/DELETE /api/documents, hierarchy endpoints]
├── GrammarController.java [REST controller for grammar checking: POST /api/grammar/check]
```

#### Data Transfer Objects (`dto/`)

```
dto/
├── AuthRequest.java [Request DTO for authentication containing email and password fields]
├── AuthResponse.java [Response DTO for authentication containing token, email, and fullName]
├── DocumentDTO.java [Document data transfer object with id, title, content, status, wordCount, timestamps, hierarchy fields]
├── DocumentRequest.java [Request DTO for document creation/update with title and content fields]
├── GrammarCheckRequest.java [Request DTO for grammar check containing text field to analyze]
├── RegisterRequest.java [Request DTO for user registration with email, password, and name fields]
```

#### Entity Models (`model/entity/`)

```
model/entity/
├── Document.java [JPA entity for documents with user relationship, title, content, status, word/character count, parent-child hierarchy, soft delete support]
├── DocumentVersion.java [JPA entity for document version history tracking changes over time]
├── User.java [JPA entity for users with Supabase ID, email, name, role, profile/preferences relationships]
├── UserEvent.java [JPA entity for tracking user activity events with type and metadata]
├── UserPreferences.java [JPA entity for user settings including theme, language, notifications, editor preferences]
├── UserProfile.java [JPA entity for extended user profile with display name, bio, avatar URL]
├── WritingMetrics.java [JPA entity for daily writing statistics including words written, documents created, grammar checks]
```

#### Enumerations (`model/enums/`)

```
model/enums/
├── DocumentStatus.java [Enum for document states: DRAFT, PUBLISHED, ARCHIVED, DELETED]
├── ErrorType.java [Enum for error classification for structured error handling]
├── EventType.java [Enum for user event types: LOGIN, LOGOUT, DOCUMENT_CREATE, etc.]
├── UserRole.java [Enum for user roles: FREE, PREMIUM, ADMIN]
```

#### Repositories (`repository/`)

```
repository/
├── DocumentRepository.java [JPA repository for Document entity with custom queries for hierarchy and user filtering]
├── UserRepository.java [JPA repository for User entity with findByEmail and findBySupabaseId queries]
```

#### Security (`security/`)

```
security/
├── AuthEntryPointJwt.java [JWT authentication entry point for handling unauthorized access]
├── JwtRequestFilter.java [JWT request filter for processing authentication tokens]
├── JwtUtil.java [JWT utility class for token generation, validation, and parsing using JJWT library]
```

#### Services (`service/`)

```
service/
├── AuthService.java [Authentication service handling user sync with Supabase and JWT validation]
├── DocumentService.java [Document business logic: CRUD, word count calculation, hierarchy management, demo user fallback]
├── GrammarService.java [Grammar checking service using OpenRouter AI API with fallback to basic spell checking]
├── StorageService.java [File storage service using AWS SDK v2 for Supabase/R2 upload operations]
├── UserDetailsServiceImpl.java [Spring Security UserDetailsService implementation for JWT authentication]
```

### Backend Resources

```
backend/src/main/resources/
├── application.yml [Default application configuration: H2 database, JWT settings, OpenRouter API, CORS, actuator]
├── application-dev.yml [Development profile configuration with H2 in-memory database]
├── application-prod.yml [Production profile configuration with Supabase PostgreSQL connection]
```

### Database Migrations (`db/migration/`)

```
db/migration/
├── V1__create_users_table.sql [Creates users table with Supabase ID, email, name, role, timestamps, indexes]
├── V2__create_user_profiles_table.sql [Creates user_profiles table for extended user information]
├── V3__create_user_preferences_table.sql [Creates user_preferences table for user settings and editor preferences]
├── V4__create_documents_table.sql [Creates documents table with user FK, title, content, status enum, word/character count, indexes]
├── V5__create_document_versions_table.sql [Creates document_versions table for version history tracking]
├── V6__create_user_events_table.sql [Creates user_events table for activity tracking with event type and metadata]
├── V7__create_writing_metrics_table.sql [Creates writing_metrics table for daily statistics aggregation]
├── V8__create_indexes.sql [Creates additional performance indexes on frequently queried columns]
├── V9__add_document_hierarchy.sql [Adds parent_id, depth, tree_order columns for document hierarchy support]
```

### Backend Test Files

```
backend/src/test/java/com/writegy/
├── (test classes would go here - currently minimal test coverage)
```

```
backend/src/test/resources/
├── application-test.yml [Test profile configuration for unit and integration tests]
```

---

## Frontend (React)

### Frontend Root Files

```
frontend/
├── .env [Frontend environment variables with VITE_ prefixed Supabase and API configuration]
├── .env.example [Frontend environment variable template with VITE_API_BASE_URL and Supabase keys]
├── Dockerfile [Docker build configuration for React/Vite frontend application]
├── index.html [HTML entry point for the React application with root div and main.jsx script]
├── package-lock.json [NPM lock file for exact dependency version matching]
├── package.json [NPM configuration with React 18, Vite, Tailwind, ReactQuill, Axios, Supabase dependencies]
├── postcss.config.js [PostCSS configuration for Tailwind CSS processing]
├── run-frontend.ps1 [PowerShell script to install dependencies and start Vite dev server]
├── tailwind.config.js [Tailwind CSS configuration with custom theme colors and content paths]
├── vite.config.js [Vite build configuration with React plugin and API proxy settings]
```

### Frontend Public Assets

```
frontend/public/
├── favicon.ico [Browser tab icon for the application]
├── robots.txt [Search engine crawler instructions for indexing]
```

### Frontend Source Code

```
frontend/src/
├── App.jsx [Main React application component with routing, auth context, and layout structure]
├── index.css [Global CSS styles including Tailwind imports and custom component styles]
├── main.jsx [React application entry point rendering App component to DOM]
```

#### Assets (`assets/`)

```
assets/
├── icons/
│   └── logo.svg [Writegy application logo in SVG format]
├── styles/
│   ├── editor.css [Styles specific to the text/markdown editor component]
│   ├── main.css [Main application styles and layout definitions]
│   └── theme.css [Theme configuration with color variables and design tokens]
```

#### Reusable Components (`components/`)

```
components/
├── Button.jsx [Reusable button component with variants (primary, secondary, danger), sizes, loading state]
├── ErrorBoundary.jsx [React error boundary component for graceful error handling and fallback UI]
├── Footer.jsx [Application footer component with links and copyright information]
├── LoadingSpinner.jsx [Animated loading spinner component with size variants (sm, md, lg)]
├── Navbar.jsx [Navigation bar component with logo, links, user menu, and auth state display]
├── ProtectedRoute.jsx [Route wrapper component that redirects unauthenticated users to login]
```

#### React Contexts (`contexts/`)

```
contexts/
├── AuthContext.jsx [Authentication context providing user state, login, logout, and Supabase integration]
```

#### Feature Modules (`features/`)

##### Authentication (`features/auth/`)

```
features/auth/
├── AuthForm.jsx [Reusable authentication form component for login/register with validation]
├── ForgotPassword.jsx [Password reset form component with email input and success feedback]
├── Login.jsx [Login page component with email/password form and Supabase auth integration]
├── Register.jsx [Registration page component with email, password, name fields and validation]
```

##### Dashboard (`features/dashboard/`)

```
features/dashboard/
├── DocumentList.jsx [Base document list component with loading states and empty state handling]
├── DocumentListView.jsx [List view display of documents with title, date, word count, actions]
├── DocumentTreeView.jsx [Hierarchical tree view of documents with expand/collapse and parent-child display]
├── RecentActivity.jsx [Component displaying recent user activity and document changes]
├── UserDashboard.jsx [Main dashboard page combining document list, stats, and quick actions]
```

##### Editor (`features/editor/`)

```
features/editor/
├── DocumentStats.jsx [Component displaying document statistics: word count, character count, last updated]
├── FileUpload.jsx [File upload component supporting PDF/DOCX with drag-and-drop and progress indicator]
├── MarkdownEditor.jsx [Markdown editor with syntax highlighting, live preview, and keyboard shortcuts]
├── SuggestionPanel.jsx [Grammar suggestions panel with individual/apply-all fixes, text highlighting on hover]
├── TextEditor.jsx [Main editor page with dual-mode (rich text/markdown), auto-save, grammar check, file upload]
```

##### Settings (`features/settings/`)

```
features/settings/
├── Preferences.jsx [User preferences page for theme, language, notification settings]
├── ProfileSettings.jsx [User profile editing page for name, bio, avatar]
├── Subscription.jsx [Subscription management page for plan selection and billing]
```

#### Layout Components (`layouts/`)

```
layouts/
├── AuthLayout.jsx [Layout wrapper for authentication pages (login, register) with centered content]
├── DashboardLayout.jsx [Layout wrapper for dashboard pages with sidebar navigation]
├── MainLayout.jsx [Main application layout with navbar, footer, and content area]
```

#### Library Utilities (`lib/`)

```
lib/
├── api.js [Axios API client with JWT interceptors, document/auth/grammar API methods]
├── supabase.js [Supabase client initialization with URL and anon key configuration]
```

##### API Modules (`lib/api/`)

```
lib/api/
├── authAPI.js [Authentication API module with login, register, logout, getCurrentUser methods]
├── axios.js [Axios instance configuration with base URL, timeout, and interceptors]
├── documentAPI.js [Document API module with CRUD operations, hierarchy, and file upload methods]
├── nlpAPI.js [NLP/Grammar API module for grammar check and text analysis endpoints]
```

##### Context Providers (`lib/contexts/`)

```
lib/contexts/
├── AuthContext.jsx [Alternative auth context implementation - duplicate of contexts/AuthContext.jsx]
├── EditorContext.jsx [Editor state context for managing editor mode, content, and suggestions]
```

##### Custom Hooks (`lib/hooks/`)

```
lib/hooks/
├── useAuth.js [Custom hook for accessing authentication context and user state]
├── useEditor.js [Custom hook for editor functionality: content management, mode switching]
├── useLocalStorage.js [Custom hook for persisting state to localStorage with serialization]
```

##### Utility Functions (`lib/utils/`)

```
lib/utils/
├── formatters.js [Utility functions for formatting dates, numbers, file sizes, text truncation]
├── validators.js [Utility functions for email, password, URL validation and form validation]
```

---

## Documentation

```
docs/
├── API-REFERENCE.md [Complete API endpoint documentation with request/response examples, error codes]
├── ARCHITECTURE.md [System architecture overview with diagrams and component descriptions]
├── DEPLOYMENT-GUIDE.md [Step-by-step deployment instructions for Render and Supabase]
├── DEVELOPMENT-SETUP.md [Local development environment setup guide with prerequisites]
├── ADRs/
│   ├── 001-architecture-overview.md [Architecture Decision Record for overall system design]
│   ├── 002-auth-strategy.md [Architecture Decision Record for Supabase JWT authentication strategy]
│   └── 003-nlp-service.md [Architecture Decision Record for NLP/grammar checking service selection]
```

---

## Infrastructure

```
infra/
├── monitoring/
│   ├── grafana-provisioning.yaml [Grafana dashboard and datasource provisioning configuration]
│   └── prometheus.yml [Prometheus scrape configuration for metrics collection]
├── supabase/
│   └── migrations/
│       ├── 0001_init_schema.sql [Initial Supabase schema setup with core tables]
│       ├── 0002_add_user_preferences.sql [Migration adding user preferences table]
│       └── 0003_create_analytics_events.sql [Migration creating analytics events tracking]
```

---

## Scripts

```
Scripts/
├── backup-db.sh [Database backup script for creating PostgreSQL dumps]
├── clear-cache.sh [Cache clearing script for application and CDN cache invalidation]
├── db-migrate.sh [Database migration script for running Flyway migrations]
```

---

## Archive (Experiments)

> **Note:** These are experimental/archived files from previous architectural approaches.

### Microservices Experiments (`archive/experiments/backend-services/`)

```
archive/experiments/backend-services/
├── analytics-service/
│   ├── Dockerfile [Docker build for analytics microservice]
│   └── src/main/java/com/writegy/analytics/
│       ├── AnalyticsApplication.java [Spring Boot app for analytics service]
│       ├── controller/AnalyticsController.java [REST endpoints for analytics data]
│       ├── model/UserEvent.java [User event entity for tracking]
│       └── repository/AnalyticsApplication.java [Repository (misplaced duplicate)]
│   └── src/main/resources/application.yml [Analytics service configuration]
├── api-gateway/
│   ├── Dockerfile [Docker build for API gateway]
│   └── src/main/java/com/writegy/gateway/
│       ├── GatewayApplication.java [Spring Cloud Gateway application]
│       ├── config/GatewayConfig.java [Gateway configuration]
│       ├── config/RouteLocatorConfig.java [Route definitions for microservices]
│       └── filters/
│           ├── AuthFilter.java [Authentication filter for gateway]
│           └── RateLimitFilter.java [Rate limiting filter for gateway]
│   └── src/main/resources/
│       ├── application.yml [Gateway service configuration]
│       └── bootstrap.yml [Bootstrap configuration for config server]
├── document-service/
│   ├── Dockerfile [Docker build for document microservice]
│   └── src/main/java/com/writegy/document/
│       ├── DocumentServiceApplication.java [Spring Boot app for document service]
│       ├── controller/DocumentController.java [Document REST endpoints]
│       ├── model/DocumentMetadata.java [Document metadata entity]
│       └── service/
│           ├── DocumentProcessingService.java [Document processing logic]
│           └── R2StorageService.java [R2 storage integration]
│   └── src/main/resources/application.yml [Document service configuration]
├── nlp-service/
│   ├── Dockerfile [Docker build for NLP microservice]
│   └── src/main/java/com/writegy/nlp/
│       ├── NlpServiceApplication.java [Spring Boot app for NLP service]
│       ├── controller/NlpController.java [NLP REST endpoints]
│       └── service/
│           ├── GrammarService.java [Grammar checking service]
│           └── HuggingFaceClient.java [HuggingFace API client]
│   └── src/main/resources/application.yml [NLP service configuration]
├── notification-service/
│   ├── Dockerfile [Docker build for notification microservice]
│   └── src/main/java/com/writegy/notification/
│       ├── NotificationApplication.java [Spring Boot app for notifications]
│       ├── config/WebSocketConfig.java [WebSocket configuration]
│       ├── controller/NotificationController.java [Notification endpoints]
│       └── service/NotificationService.java [Notification delivery logic]
│   └── src/main/resources/application.yml [Notification service configuration]
└── user-service/
    ├── Dockerfile [Docker build for user microservice]
    └── src/main/java/com/writegy/user/
        ├── UserServiceApplication.java [Spring Boot app for user service]
        ├── config/SecurityConfig.java [User service security config]
        ├── controller/
        │   ├── AuthController.java [Auth endpoints]
        │   └── ProfileController.java [Profile endpoints]
        ├── model/
        │   ├── User.java [User entity]
        │   └── UserProfile.java [User profile entity]
        ├── repository/UserRepository.java [User data access]
        └── service/
            ├── AuthService.java [Authentication logic]
            └── SupabaseClient.java [Supabase integration client]
    └── src/main/resources/
        ├── application.yml [User service configuration]
        └── db/migration/V1_create_users_table.sql [User table migration]
```

### Monolith Experiment (`archive/experiments/services/writegy-core/`)

```
archive/experiments/services/writegy-core/
├── pom.xml [Maven config for early monolith version]
├── README.md [Documentation for writegy-core service]
├── src/main/java/com/writegy/
│   ├── WritegyApplication.java [Main application class]
│   ├── config/AppConfig.java [Application configuration]
│   ├── controller/TextController.java [Text analysis endpoints]
│   ├── model/TextRequest.java [Text request DTO]
│   └── service/TextAnalysisService.java [Text analysis logic]
├── src/main/resources/
│   ├── application.properties [Application properties]
│   ├── static/css/style.css [Static CSS styles]
│   └── templates/result.html [Thymeleaf result template]
├── src/test/java/com/writegy/WritegyApplicationTests.java [Application tests]
└── target/ [Build output directory - compiled classes and resources]
```

### Unused Infrastructure (`archive/infra-unused/`)

```
archive/infra-unused/
├── oracle-vm-setup.sh [Oracle Cloud VM setup script - unused infrastructure]
└── cloudfare/
    ├── gateway-worker.js [Cloudflare Workers gateway script]
    ├── health-check.js [Health check endpoint script]
    └── wrangler.toml [Cloudflare Wrangler configuration]
```

---

## 📊 File Statistics

| Category | File Count | Description |
|----------|------------|-------------|
| Root Files | 12 | Configuration, documentation, deployment files |
| Backend Java | 40+ | Controllers, services, entities, config, DTOs |
| Backend Resources | 12 | Application configs and database migrations |
| Frontend Source | 50+ | React components, hooks, contexts, utilities |
| Documentation | 7 | API docs, architecture, ADRs |
| Infrastructure | 5 | Monitoring and Supabase migrations |
| Scripts | 3 | Database and cache management |
| Archive | 80+ | Experimental microservices and unused infra |
| **Total** | **~150+** | Complete project file inventory |

---

## 🔑 Key Files for Quick Reference

| Purpose | File Path |
|---------|-----------|
| Main Entry (Backend) | `backend/src/main/java/com/writegy/WritegyApplication.java` |
| Main Entry (Frontend) | `frontend/src/main.jsx` |
| Security Config | `backend/src/main/java/com/writegy/config/SecurityConfig.java` |
| Document CRUD | `backend/src/main/java/com/writegy/controller/DocumentController.java` |
| Grammar AI | `backend/src/main/java/com/writegy/service/GrammarService.java` |
| Text Editor | `frontend/src/features/editor/TextEditor.jsx` |
| API Client | `frontend/src/lib/api.js` |
| Auth Context | `frontend/src/contexts/AuthContext.jsx` |
| Database Schema | `backend/src/main/resources/db/migration/V1-V9 SQL files` |
| API Documentation | `docs/API-REFERENCE.md` |

---

**Document Generated:** 2026-03-23  
**Maintained By:** Development Team  
**Update Frequency:** On major releases or architectural changes