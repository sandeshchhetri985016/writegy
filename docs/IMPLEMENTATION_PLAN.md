# Writegy Document Export Feature - Implementation Plan

## Overview
Implement document export functionality supporting PDF, DOCX, and Markdown formats.

## Phase 1: Backend Implementation

### 1.1 ExportService.java
- [x] Create service class with methods for each export format
- [x] `generateMarkdown(Document doc)` - Strip HTML, convert to markdown
- [x] `generatePdf(Document doc)` - Convert HTML to PDF using iText7
- [x] `generateDocx(Document doc)` - Convert HTML to DOCX using Apache POI
- [x] Handle content type detection (HTML vs Markdown)

### 1.2 ExportController.java
- [x] Create REST controller with export endpoint
- [x] `POST /api/documents/{id}/export?format={pdf|docx|md}`
- [x] Validate document ownership
- [x] Return file with appropriate Content-Type headers
- [x] Error handling (404, 403, 400, 500)

### 1.3 Dependencies (pom.xml)
- [x] Add jsoup for HTML parsing
- [x] Add iText7 for PDF generation
- [x] Add Apache POI for DOCX generation

## Phase 2: Frontend Implementation

### 2.1 exportAPI.js
- [x] Create API helper functions
- [x] `exportToPdf(documentId)` - Download PDF blob
- [x] `exportToDocx(documentId)` - Download DOCX blob
- [x] `exportToMarkdown(documentId)` - Download MD blob
- [x] Handle blob download and filename generation

### 2.2 DocumentExport.jsx
- [x] Create export dropdown component
- [x] Three export format options (PDF, DOCX, Markdown)
- [x] Loading spinner integration
- [x] Toast notifications for success/error
- [x] Filename format: {title}-{timestamp}.{ext}

### 2.3 TextEditor.jsx Integration
- [x] Add export button to toolbar
- [x] Wire up export functionality
- [x] Handle loading states

## Phase 3: Testing & Verification

### 3.1 Backend Testing
- [x] Unit tests for ExportService
- [x] Integration tests for ExportController

### 3.2 Frontend Testing
- [x] Test export to each format
- [x] Verify file downloads correctly
- [x] Test error scenarios

### 3.3 End-to-End Testing
- [x] Create test document with formatting
- [x] Export to all 3 formats
- [x] Verify files open correctly

## File Structure

```
backend/src/main/java/com/writegy/
├── controller/
│   └── ExportController.java (NEW)
├── service/
│   └── ExportService.java (NEW)

frontend/src/
├── features/editor/
│   ├── DocumentExport.jsx (NEW)
│   └── TextEditor.jsx (MODIFY)
├── lib/api/
│   └── exportAPI.js (NEW)
```

## Success Criteria
✓ Users can export documents in 3 formats
✓ Exported files named with title + timestamp
✓ Formatting preserved where applicable
✓ Files download automatically
✓ Success/error messages shown
✓ Document ownership respected
✓ No duplicate documents created
✓ Works for both Rich Text and Markdown editor modes

---

## 📝 Changelog

### v1.2.0 - PostgreSQL Migration & Bug Fixes (2026-03-31)

#### 🗄️ Database Migration

**PostgreSQL Migration:**
- ✅ Migrated from H2 in-memory to Supabase PostgreSQL
- ✅ Data now persists across server restarts
- ✅ Flyway migrations enabled for schema management
- ✅ Hibernate ddl-auto set to `update` for automatic table creation
- ✅ PostgreSQL dialect configured for optimal performance

#### 🐛 Bug Fixes

**Canvas JSONB Mapping:**
- ✅ Fixed `canvas_data` column type mismatch (TEXT vs JSONB)
- ✅ Added `@JdbcTypeCode(SqlTypes.JSON)` annotation to `Document.canvasData`
- ✅ Canvas documents now save and load correctly

**Authentication Duplicate User Fix:**
- ✅ Added `findBySupabaseId()` method to `UserRepository`
- ✅ Updated `AuthService.syncSupabaseUser()` to check by `supabase_id` first
- ✅ Prevents duplicate key constraint violations
- ✅ Updates existing user's `supabase_id` if not set

**Routing Fix for Canvas Creation:**
- ✅ Fixed navigation after creating new canvas documents
- ✅ Added `navigate()` to update URL with new document ID
- ✅ Prevents `GET /api/documents/undefined` errors
- ✅ Applied to both manual save and auto-save functions

#### 📁 Files Changed

**Backend:**
- `application.yml` - PostgreSQL configuration, Flyway enabled
- `application-dev.yml` - PostgreSQL configuration, ddl-auto=update
- `application-prod.yml` - PostgreSQL configuration, ddl-auto=update
- `Document.java` - Added `@JdbcTypeCode(SqlTypes.JSON)` for canvasData
- `UserRepository.java` - Added `findBySupabaseId()` method
- `AuthService.java` - Updated user sync logic to handle duplicates

**Frontend:**
- `TextEditor.jsx` - Added navigation after document creation

**Documentation:**
- `README.md` - Updated with PostgreSQL migration info
- `IMPLEMENTATION_PLAN.md` - Added v1.2.0 changelog
- `CANVAS_IMPLEMENTATION_PLAN.md` - Updated canvas status
- `DEVELOPMENT-SETUP.md` - Updated database setup instructions
- `ARCHITECTURE.md` - Updated architecture diagram
- `API-REFERENCE.md` - Updated API documentation
- `DEPLOYMENT-GUIDE.md` - Updated deployment instructions

#### 🔧 Technical Details

**Database Configuration:**
```yaml
spring:
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/writegy}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  flyway:
    enabled: true
```

**Canvas JSONB Mapping:**
```java
@JdbcTypeCode(SqlTypes.JSON)
@Column(columnDefinition = "jsonb")
private String canvasData;
```

**User Sync Logic:**
```java
// First, try to find by supabase_id
if (sub != null) {
    Optional<User> existingBySupabaseId = userRepository.findBySupabaseId(sub);
    if (existingBySupabaseId.isPresent()) {
        // Update existing user
        return existingBySupabaseId.get();
    }
}
// Second, try to find by email
return userRepository.findByEmail(email)
    .map(existingUser -> {
        // Update supabase_id if not set
        if (sub != null && existingUser.getSupabaseId() == null) {
            existingUser.setSupabaseId(sub);
        }
        return userRepository.save(existingUser);
    })
    .orElseGet(() -> {
        // Create new user
        User newUser = new User();
        newUser.setSupabaseId(sub);
        return userRepository.save(newUser);
    });
```

**Routing Fix:**
```javascript
// After creating new document, navigate to correct URL
setCurrentDocumentId(response.data.id)
navigate(`/editor/${response.data.id}`, { replace: true })
```

### v1.1.0 - Grammar Check Improvements (2026-03-26)

#### ✨ New Features

**Grammar Check System:**
- ✅ **Suggestions Only** - Returns improvement suggestions (not full corrected text)
- ✅ **Apply Fix Functionality** - Each suggestion can be applied individually
- ✅ **Code/JSON/HTML Support** - Handles escaped characters in suggestions
- ✅ **Nested JSON Handling** - Robust parsing for complex AI responses
- ✅ **All Errors** - Finds all grammar, spelling, and style issues
- ✅ **Extended Timeout** - 180s timeout for free AI models

**Frontend Improvements:**
- ✅ Increased Axios timeout from 60s to 180s for free AI models
- ✅ Fixed "Apply Fix" for code/JSON/HTML by unescaping strings
- ✅ Removed "Corrected Version" section from SuggestionPanel
- ✅ Updated API-REFERENCE.md with new grammar check response format

**Backend Improvements:**
- ✅ Added DotEnvConfig for environment variable configuration
- ✅ Improved JSON stripping logic for markdown code blocks
- ✅ Added nested JSON detection and unwrapping
- ✅ Fixed dangerous fallback that was injecting raw AI response
- ✅ Improved prompt to prevent nested JSON and request all errors

#### 📁 Files Changed

**Backend:**
- `GrammarService.java` - Improved JSON handling and prompt
- `DotEnvConfig.java` - New environment configuration
- `application.yml` - Updated configuration

**Frontend:**
- `api.js` - Increased timeout to 180s
- `TextEditor.jsx` - Fixed string unescaping for Apply Fix
- `SuggestionPanel.jsx` - Removed corrected text section

**Documentation:**
- `README.md` - Added grammar check improvements
- `API-REFERENCE.md` - Updated grammar check API documentation
- `ARCHITECTURE.md` - Added Grammar Service architecture section
- `FILE_STRUCTURE.md` - Added DotEnvConfig.java

#### 🔧 Technical Details

**JSON Handling:**
- Strip markdown code blocks using regex
- Detect nested JSON inside "replacement" field
- Unwrap nested JSON when found
- Return empty suggestions for invalid responses

**Prompt Improvements:**
- Added rule: "Do NOT include nested JSON"
- Added rule: "If unable to provide suggestions, return: {"suggestions":[]}"
- Emphasized escaping quotes in string values

**Frontend Fixes:**
- Unescape `\"` to `"` before searching for text
- Unescape `\n` to newline character
- Unescape `\t` to tab character
