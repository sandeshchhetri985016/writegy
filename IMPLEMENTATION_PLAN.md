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