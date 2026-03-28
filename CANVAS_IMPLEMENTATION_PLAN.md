# 🎨 Writegy Canvas Implementation Plan
## Headless tldraw Integration - GoodNotes + Bear Hybrid

**Last Updated:** 2026-03-27  
**Status:** 🟡 Planning Complete - Ready for Implementation  
**Estimated Timeline:** 6 weeks  

---

## 📋 Executive Summary

This plan integrates **handwriting canvas capabilities** into Writegy using the **headless tldraw** architecture. This approach:

- ✅ Solves complex canvas math (shapes, lasso, eraser) via tldraw engine
- ✅ Maintains full UI control with custom Tailwind toolbar
- ✅ Preserves existing text/markdown editor functionality
- ✅ Fits within current resource constraints (Supabase, Render, R2)

---

## 🎯 Feature Scope

### ✅ **In Scope (Phase 1-5)**

| Category | Features | Complexity |
|----------|----------|------------|
| **Canvas Drawing** | Pen, eraser, highlighter, lasso | ✅ Native tldraw |
| **Shapes** | Rectangle, circle, arrow, line | ✅ Native tldraw |
| **Sticky Notes** | Text boxes on canvas | ✅ Native tldraw |
| **Image Embedding** | Upload images to canvas | ✅ Native tldraw |
| **Multi-Page** | Multiple canvas pages per document | ✅ Native tldraw |
| **Custom Toolbar** | Tailwind UI matching Writegy design | ⚠️ Medium |
| **Canvas Search** | Find text in canvas shapes | ⚠️ Medium |
| **Canvas Export** | Export canvas to PNG | ✅ Native tldraw |
| **Hybrid Documents** | Text + Canvas in same document | ⚠️ Medium |
| **Basic Tags** | Simple tag system for organization | ⚠️ Medium |

### ❌ **Out of Scope (Deferred)**

| Feature | Reason |
|---------|--------|
| Custom brush physics | Complex math, tldraw covers basics |
| Audio recording | Storage constraints |
| Real-time collaboration | Very complex, WebSocket + CRDT |
| OCR for handwriting | Needs ML model |
| Image generation | API costs |
| Meeting transcription | API costs + complexity |

---

## 🏗️ Architecture Overview

### **Current Stack**
```
Frontend: React 18 + Vite + Tailwind CSS
Backend:  Spring Boot 3.4.4 + Java 21
Database: Supabase PostgreSQL (500MB free)
Storage:  Cloudflare R2 (1GB free)
Auth:     Supabase Auth + JWT
AI:       OpenRouter (free models)
```

### **New Components**
```
Frontend: + tldraw (canvas engine)
          + CanvasEditor.jsx
          + CanvasToolbar.jsx
          + CanvasSearch.jsx
          + PageTabs.jsx

Backend:  + canvas_data JSONB column
          + content_type field

Database: + V11__add_canvas_support.sql
          + V12__add_tags_system.sql
```

---

## 📊 Resource Impact Analysis

### **Database (Supabase PostgreSQL - 500MB Free)**

| Metric | Current | After Canvas | Status |
|--------|---------|--------------|--------|
| Avg document size | ~5KB | ~50-200KB | ✅ OK |
| 1000 documents | ~5MB | ~100-200MB | ✅ Within limit |
| Query performance | Fast | Fast (JSONB) | ✅ OK |

**New Storage Needs:**
- Canvas JSON data: ~50-200KB per document
- Tags table: ~1MB for 10K tags
- Document-tag relations: ~5MB for 100K associations

**Total estimated:** ~250MB - **Within free tier**

### **Frontend Bundle**

| Package | Size | Impact |
|---------|------|--------|
| `tldraw` | ~2MB (gzipped ~600KB) | ⚠️ Medium |
| `@tldraw/assets` | ~1.5MB (lazy loaded) | ✅ Low |

**Mitigation:** Lazy load tldraw only when canvas mode is active.

### **Backend (Render - 750 hrs/month Free)**

| Current Usage | Projected Usage | Status |
|---------------|-----------------|--------|
| ~200 hrs/month | ~250-300 hrs/month | ✅ Sufficient |

**New Processing:**
- Canvas JSON storage/retrieval: Minimal CPU
- No new API endpoints needed

### **File Storage (Cloudflare R2 - 1GB Free)**

| Current Usage | Projected Usage | Status |
|---------------|-----------------|--------|
| ~100MB | ~300-500MB | ✅ Sufficient |

**New Storage:**
- Embedded images in canvas: ~1-5MB per image
- Canvas exports (PNG): ~1-3MB per export

---

## 🗓️ Implementation Phases

### **Phase 1: Database & Engine Foundation**
**Timeline:** Week 1-2  
**Goal:** Set up tldraw and database schema

#### Backend Tasks
- [ ] Create migration `V11__add_canvas_support.sql`
  ```sql
  ALTER TABLE documents ADD COLUMN canvas_data JSONB;
  ALTER TABLE documents ADD COLUMN content_type VARCHAR(20) DEFAULT 'text';
  CREATE INDEX idx_documents_content_type ON documents(content_type);
  ```
- [ ] Update `Document.java` entity with new fields
- [ ] Update `DocumentService.java` to handle canvas data
- [ ] Test canvas data storage/retrieval

#### Frontend Tasks
- [ ] Install tldraw: `npm install tldraw`
- [ ] Create `CanvasEditor.jsx` component
- [ ] Implement headless tldraw with `hideUi={true}`
- [ ] Set up canvas data persistence
- [ ] Add mode toggle (Text / Canvas)

#### Deliverables
- ✅ tldraw rendering in headless mode
- ✅ Canvas data saving to database
- ✅ Basic mode switching UI

---

### **Phase 2: Custom Tailwind Toolbar**
**Timeline:** Week 2-3  
**Goal:** Build custom drawing toolbar

#### Frontend Tasks
- [ ] Create `CanvasToolbar.jsx` component
- [ ] Implement tool selection (pen, eraser, lasso, select)
- [ ] Build color picker (8-12 colors)
- [ ] Build size picker (small, medium, large)
- [ ] Add read-only toggle button
- [ ] Style toolbar with Tailwind (floating, rounded, shadow)

#### Implementation Details
```javascript
// Tool mapping
const toolMap = {
  'pen': 'draw',
  'eraser': 'eraser',
  'lasso': 'select',
  'select': 'select'
}

// Style mapping
editor.setStyleForNextShapes(DefaultColorStyle, color)
editor.setStyleForNextShapes(DefaultSizeStyle, size)
```

#### Deliverables
- ✅ Custom toolbar matching Writegy design
- ✅ Tool switching works correctly
- ✅ Color and size selection
- ✅ Read-only mode toggle

---

### **Phase 3: Shapes & Insertions**
**Timeline:** Week 3-4  
**Goal:** Add shape tools and image uploads

#### Frontend Tasks
- [ ] Create shape menu (rectangle, circle, arrow, line)
- [ ] Implement shape tool activation
- [ ] Add sticky note tool
- [ ] Build image upload button
- [ ] Integrate with StorageService for image upload
- [ ] Insert uploaded images into canvas

#### Implementation Details
```javascript
// Shape activation
editor.setCurrentTool('geo')
editor.setStyleForNextShapes(GeoStyle, 'rectangle')

// Image insertion
const url = await storageService.uploadFile(file)
editor.createShapes([{
  type: 'image',
  x: 100, y: 100,
  props: { src: url, w: 200, h: 150 }
}])
```

#### Deliverables
- ✅ Shape menu with 4+ shapes
- ✅ Sticky notes on canvas
- ✅ Image upload and embedding
- ✅ Images stored in R2

---

### **Phase 4: Page Management**
**Timeline:** Week 4-5  
**Goal:** Multi-page canvas documents

#### Frontend Tasks
- [ ] Create `PageTabs.jsx` component
- [ ] Display pages as horizontal tabs
- [ ] Implement page switching
- [ ] Add "New Page" button
- [ ] Add page rename functionality
- [ ] Add page delete (with confirmation)

#### Implementation Details
```javascript
// Get pages
const pages = editor.getPages()

// Switch page
editor.setCurrentPage(pageId)

// Create page
editor.createPage({ name: 'New Page' })

// Delete page
editor.deletePage(pageId)
```

#### Deliverables
- ✅ Page tabs UI
- ✅ Page switching works
- ✅ Add/rename/delete pages
- ✅ All pages save to single canvas_data field

---

### **Phase 5: Canvas Search & Export**
**Timeline:** Week 5-6  
**Goal:** Search and export functionality

#### Frontend Tasks
- [ ] Create `CanvasSearch.jsx` component
- [ ] Implement text search in canvas shapes
- [ ] Add search result navigation (zoom to match)
- [ ] Build "Export as PNG" button
- [ ] Implement canvas export using tldraw API
- [ ] Add export progress indicator

#### Implementation Details
```javascript
// Search canvas
function searchCanvas(editor, query) {
  const shapes = editor.getCurrentPageShapes()
  const matches = shapes.filter(shape => {
    if (shape.type === 'text') {
      return shape.props.text.toLowerCase().includes(query.toLowerCase())
    }
    return false
  })
  
  if (matches.length > 0) {
    editor.select(...matches.map(s => s.id))
    editor.zoomToSelection()
  }
  
  return matches.length
}

// Export canvas
const exportCanvas = async (editor) => {
  const blob = await editor.toImage(editor.getCurrentPageId(), {
    type: 'png',
    quality: 1,
    background: true,
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'canvas-export.png'
  a.click()
}
```

#### Deliverables
- ✅ Search input in canvas toolbar
- ✅ Text search finds matches
- ✅ Camera zooms to search results
- ✅ Export to PNG works
- ✅ Exported file downloads

---

## 🏷️ Bonus: Basic Tag System

**Timeline:** Parallel to Phase 1-2  
**Goal:** Simple organization via tags

### Database Schema
```sql
-- V12__add_tags_system.sql
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE TABLE document_tags (
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, tag_id)
);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX idx_document_tags_tag_id ON document_tags(tag_id);
```

### Backend Tasks
- [ ] Create `Tag.java` entity
- [ ] Create `TagRepository.java`
- [ ] Create `TagService.java`
- [ ] Create `TagController.java`
- [ ] Add tag CRUD endpoints

### Frontend Tasks
- [ ] Create `TagManager.jsx` component
- [ ] Add tag selector to document editor
- [ ] Add tag filter to dashboard
- [ ] Display tags on document cards

---

## 🔧 Technical Considerations

### **1. tldraw Version**
Use `tldraw@^2.0.0` (latest stable):
```bash
npm install tldraw@latest
```

### **2. Canvas Data Compression**
Large canvas data (>1MB) should be compressed:
```javascript
import pako from 'pako'

// Compress before save
const compressed = pako.deflate(JSON.stringify(snapshot))
const base64 = btoa(String.fromCharCode(...compressed))

// Decompress after load
const decoded = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
const decompressed = pako.inflate(decoded, { to: 'string' })
const snapshot = JSON.parse(decompressed)
```

### **3. Lazy Loading tldraw**
```javascript
import { lazy, Suspense } from 'react'

const CanvasEditor = lazy(() => import('./CanvasEditor'))

// In parent component
<Suspense fallback={<LoadingSpinner />}>
  <CanvasEditor ... />
</Suspense>
```

### **4. Memory Management**
- Limit pages per document (e.g., 50 max)
- Clean up shapes on page delete
- Monitor memory usage in dev tools

### **5. Touch vs Mouse Events**
tldraw handles this natively via Pointer Events API. No additional work needed.

---

## 🎨 UI/UX Design

### **Mode Toggle (Editor Header)**
```jsx
<div className="flex items-center bg-slate-100 rounded-lg p-1">
  <button
    onClick={() => setMode('text')}
    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all
      ${mode === 'text' 
        ? 'bg-white text-brand-600 shadow-sm' 
        : 'text-slate-600 hover:text-slate-900'}`}
  >
    <Type className="w-4 h-4 mr-2 inline" />
    Text
  </button>
  <button
    onClick={() => setMode('canvas')}
    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all
      ${mode === 'canvas' 
        ? 'bg-white text-brand-600 shadow-sm' 
        : 'text-slate-600 hover:text-slate-900'}`}
  >
    <PenTool className="w-4 h-4 mr-2 inline" />
    Canvas
  </button>
</div>
```

### **Canvas Toolbar (Floating Bottom)**
```jsx
<div className="fixed bottom-8 left-1/2 -translate-x-1/2 
                bg-white dark:bg-slate-800 rounded-2xl 
                shadow-xl border border-slate-200 dark:border-slate-700
                p-2 flex gap-1 items-center">
  {/* Tool buttons */}
  <ToolButton icon={MousePointer} active={tool === 'select'} />
  <ToolButton icon={Pen} active={tool === 'draw'} />
  <ToolButton icon={Eraser} active={tool === 'eraser'} />
  <ToolButton icon={Lasso} active={tool === 'lasso'} />
  
  <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />
  
  {/* Shape menu */}
  <ShapeMenu />
  
  <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />
  
  {/* Color picker */}
  <ColorPicker />
  
  {/* Size picker */}
  <SizePicker />
  
  <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />
  
  {/* Actions */}
  <ToolButton icon={ImagePlus} onClick={handleImageUpload} />
  <ToolButton icon={Search} onClick={() => setShowSearch(true)} />
  <ToolButton icon={Download} onClick={handleExport} />
  <ToolButton icon={Lock} onClick={toggleReadonly} />
</div>
```

### **Page Tabs (Horizontal, Below Header)**
```jsx
<div className="flex gap-1 overflow-x-auto px-4 py-2 
                bg-slate-50 dark:bg-slate-900 
                border-b border-slate-200 dark:border-slate-700">
  {pages.map(page => (
    <button
      key={page.id}
      onClick={() => editor.setCurrentPage(page.id)}
      className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap
        ${page.id === currentPageId 
          ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' 
          : 'text-slate-600 hover:bg-white/50 dark:hover:bg-slate-800'}`}
    >
      {page.name}
    </button>
  ))}
  <button 
    onClick={() => editor.createPage({})}
    className="px-2 py-1.5 text-slate-400 hover:text-slate-600 
               hover:bg-white/50 rounded-md"
  >
    <Plus className="w-4 h-4" />
  </button>
</div>
```

---

## ⚠️ Potential Pitfalls & Solutions

| Pitfall | Solution |
|---------|----------|
| Large canvas data (>1MB) | Compress with pako before storage |
| tldraw CSS conflicts | Scope tldraw styles to canvas container |
| Memory leaks on page switch | Properly unmount tldraw instance |
| Slow initial load | Lazy load tldraw assets |
| Touch vs mouse events | tldraw handles this natively |
| Canvas state conflicts | Use tldraw's built-in snapshot system |

---

## 📈 Success Metrics

### **Technical Metrics**
- Canvas load time: < 2 seconds
- Canvas save time: < 500ms
- Export time: < 3 seconds
- Memory usage: < 200MB per canvas document

### **User Metrics**
- Mode switching: < 100ms
- Tool response: < 50ms
- Search results: < 1 second

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `frontend/src/features/editor/CanvasEditor.jsx` | Main canvas component |
| `frontend/src/features/editor/CanvasToolbar.jsx` | Custom toolbar |
| `frontend/src/features/editor/CanvasSearch.jsx` | Search functionality |
| `frontend/src/features/editor/PageTabs.jsx` | Page management |
| `backend/src/main/resources/db/migration/V11__add_canvas_support.sql` | Canvas schema |
| `backend/src/main/resources/db/migration/V12__add_tags_system.sql` | Tags schema |
| `backend/src/main/java/com/writegy/model/entity/Tag.java` | Tag entity |
| `backend/src/main/java/com/writegy/service/TagService.java` | Tag service |

---

## 📝 Notes

- tldraw is MIT licensed - free for commercial use
- Headless mode gives full UI control
- Canvas data is stored as JSONB - queryable if needed
- Multi-page support comes free with tldraw
- Export to PNG is native tldraw functionality

---

## ✅ Definition of Done

Each phase is complete when:
1. ✅ All tasks checked off
2. ✅ Code reviewed and tested
3. ✅ No console errors
4. ✅ Responsive on mobile/tablet
5. ✅ Accessible (keyboard navigation, ARIA labels)
6. ✅ Documentation updated

---

**Ready to implement! Switch to ACT MODE to begin Phase 1.**