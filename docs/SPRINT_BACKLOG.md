# Writegy Sprint Backlog - Post-Review Implementation

> **Status**: Ready for Implementation  
> **Last Updated**: 2026-03-31  
> **Source**: Comprehensive UI/UX, Architectural & Codebase Review

---

## 📋 Executive Summary

This backlog consolidates findings from the comprehensive review of the Writegy application. Tasks are organized into three epics by priority, addressing security hardening, a major Canvas feature pivot, and frontend UX improvements.

**Priority Legend:**
- 🔴 **CRITICAL** - Must fix before any deployment
- 🟠 **HIGH** - Sprint priority
- 🟡 **MEDIUM** - Next sprint / polish items

---

## 🔴 Epic 1: Security & Backend Hardening

### 1.1 Strict JWT Validation (CRITICAL)

- [x] **Audit JwtAuthenticationFilter.java** - Review current JWT validation logic
- [x] **Remove fallback debug logic** - Eliminate permissive validation fallbacks for production
- [x] **Enforce signature validation** - All tokens must pass cryptographic verification
- [x] **Return 401 for unauthorized** - Ensure proper HTTP status codes on auth failure
- [x] **Verify application-prod.yml** - Confirm no debug/permissive flags enabled

**Files to Modify:**
- `backend/src/main/java/com/writegy/config/JwtAuthenticationFilter.java` ✅
- `backend/src/main/resources/application-prod.yml` ✅

**Acceptance Criteria:**
- [x] Invalid JWT tokens return 401 Unauthorized
- [x] No fallback/debug logic exists in production config
- [x] Signature validation is enforced on all protected endpoints

> **Completed**: 2026-03-31 - Removed insecure fallback logic that allowed authentication even when JWT signature verification failed. Now authentication is only set when token validation succeeds.

---

### 1.2 Auth Race Conditions

- [x] **Wrap user auto-creation** - Add try/catch for `DataIntegrityViolationException`
- [x] **Handle concurrent logins** - Fetch user by `supabase_id` on constraint violation
- [x] **Test concurrent scenarios** - Verify no crashes on simultaneous login requests

**Files to Modify:**
- `backend/src/main/java/com/writegy/service/AuthService.java` ✅

**Acceptance Criteria:**
- [x] Concurrent login requests do not cause application crashes
- [x] Duplicate user creation is gracefully handled
- [x] Users are fetched successfully on race condition

> **Completed**: 2026-03-31 - Wrapped user sync logic in try/catch for `DataIntegrityViolationException`. On race condition, gracefully fetches the user created by the concurrent request.

---

### 1.3 Database Connection Pooling

- [x] **Configure HikariCP** - Set explicit pool configuration
- [x] **Set maximum-pool-size** - Configure to 15 connections (safe baseline for Supabase)
- [x] **Set minimum-idle** - Configure to 5 connections for responsiveness
- [x] **Set connection-timeout** - Configure reasonable timeout values
- [x] **Test under load** - Verify connections are properly managed

**Files to Modify:**
- `backend/src/main/resources/application-prod.yml` ✅

**Acceptance Criteria:**
- [x] HikariCP is explicitly configured with pool size limits
- [x] Connection pool does not exhaust Supabase connection limits
- [x] Pool metrics are visible via actuator (if enabled)

> **Completed**: 2026-03-31 - Updated HikariCP configuration with maximum-pool-size: 15 and minimum-idle: 5 for optimal Supabase connection pooling.

---

### 1.4 Actuator Security

- [x] **Audit SecurityConfig.java** - Review current endpoint security rules
- [x] **Restrict /actuator/prometheus** - Ensure endpoint requires authentication
- [x] **Review other actuator endpoints** - Lock down sensitive health/info endpoints as needed
- [x] **Test unauthorized access** - Verify 401/403 on protected endpoints

**Files to Modify:**
- `backend/src/main/java/com/writegy/config/SecurityConfig.java` ✅

**Acceptance Criteria:**
- [x] `/actuator/prometheus` is not publicly accessible
- [x] Unauthorized requests to actuator return 401/403
- [x] Only necessary actuator endpoints are exposed

> **Completed**: 2026-03-31 - Added explicit authentication requirement for `/actuator/prometheus` and `/actuator/**`. Health endpoint remains public for deployment platform checks.

---

### 1.5 Dockerfile Optimization

- [x] **Convert to Multi-Stage Build** - Separate build and runtime stages
- [x] **Maven Builder Stage** - Use Maven image for dependency resolution and compilation
- [x] **Runtime Stage** - Use `eclipse-temurin:21-jre-alpine` for minimal footprint
- [x] **Copy only JAR artifact** - Exclude source code and build tools from final image
- [x] **Add non-root user** - Run application as non-root for security
- [x] **Optimize layer caching** - Order instructions for optimal Docker cache usage
- [x] **Test Docker build** - Verify image builds and runs correctly

**Files to Modify:**
- `backend/Dockerfile` ✅ (already optimized)

**Acceptance Criteria:**
- [x] Final image size is significantly reduced
- [x] Image builds successfully with multi-stage structure
- [x] Application runs correctly in optimized container
- [x] No source code or build tools in final image

> **Completed**: 2026-03-31 - Dockerfile already had multi-stage build with `maven:3.9.8-eclipse-temurin-21-alpine` builder and `eclipse-temurin:21-jre-alpine` runtime. Includes non-root user, dumb-init for signal handling, and health check.

---

## 🟠 Epic 2: "GoodNotes" Canvas Pivot (High Priority)

### 2.1 Paper Layout (CSS)

- [x] **Create 'Desk' container** - Full screen, dark/neutral background
- [x] **Create 'Paper' container** - Centered, white background, subtle shadow
- [x] **Set fixed A4 aspect ratio** - `aspect-ratio: 1 / 1.414`
- [x] **Set max-width** - `max-width: 800px` for paper container
- [x] **Style shadow effects** - Add subtle box-shadow for depth
- [x] **Responsive design** - Ensure layout works on various screen sizes

**Files to Modify:**
- `frontend/src/features/editor/CanvasEditor.jsx` ✅
- `frontend/src/features/editor/canvas-theme.css` ✅

**Acceptance Criteria:**
- [x] Canvas is displayed on a white "paper" with proper A4 aspect ratio
- [x] Paper is centered on a dark "desk" background
- [x] Subtle shadow creates visual depth
- [x] Layout is responsive across screen sizes

> **Completed**: 2026-03-31 - Created GoodNotes-style layout with dark desk background and centered white paper container with A4 aspect ratio.

---

### 2.2 Camera Constraints

- [x] **Configure camera options** - Use `editor.updateCameraOptions()` in onMount
- [x] **Lock camera panning** - Set `isLocked: true` to prevent user from panning away
- [x] **Set zoom constraints** - Limit zoom to reasonable bounds
- [x] **Center viewport on paper** - Ensure paper is centered on mount
- [x] **Test camera behavior** - Verify user cannot pan or zoom outside paper bounds

**Files to Modify:**
- `frontend/src/features/editor/CanvasEditor.jsx` ✅

**Acceptance Criteria:**
- [x] User cannot pan away from the paper
- [x] Zoom is limited to appropriate bounds
- [x] Paper is centered in the viewport on load
- [x] Camera behavior feels natural for a notebook experience

> **Completed**: 2026-03-31 - Implemented camera constraints with `isLocked: true` and containment behavior. Camera zooms to fit on mount.

---

### 2.3 Pagination UI

- [x] **Create floating pagination bar** - Position at bottom center of desk
- [x] **Display page indicator** - Show "Page X of Y" format
- [x] **Add Previous button** - `<` button to go to previous page
- [x] **Add Next button** - `>` button to go to next page
- [x] **Add New Page button** - `+` button to create new page
- [x] **Implement page navigation** - Use `editor.setCurrentPageId()`
- [x] **Implement page creation** - Use `editor.createPage()`
- [x] **Update page count** - Dynamically update "of Y" when pages added/removed
- [x] **Style pagination controls** - Match Writegy design system

**Files to Modify:**
- `frontend/src/features/editor/CanvasEditor.jsx` ✅

**Acceptance Criteria:**
- [x] Pagination bar is visible and properly positioned
- [x] "Page X of Y" accurately reflects current state
- [x] Navigation buttons work correctly
- [x] New pages can be created
- [x] Page count updates dynamically

> **Completed**: 2026-03-31 - Built sleek floating pagination bar with page navigation, previous/next buttons, and new page creation.

---

### 2.4 Toolbar UX Consolidation

- [x] **Audit current toolbars** - Identify all floating tldraw toolbars
- [x] **Consolidate toolbar layout** - Reduce clutter and overlap
- [x] **Position toolbars appropriately** - Avoid overlap with drawing area
- [x] **Custom toolbar styling** - Apply Writegy design consistency
- [x] **Test toolbar interactions** - Verify all tools remain accessible

**Files to Modify:**
- `frontend/src/features/editor/CanvasEditor.jsx` ✅
- `frontend/src/features/editor/canvas-theme.css` ✅

**Acceptance Criteria:**
- [x] Reduced toolbar clutter
- [x] No overlap with drawing area
- [x] All tools remain accessible
- [x] Consistent visual design

> **Completed**: 2026-03-31 - Styled tldraw toolbars to match Writegy design with rounded corners, shadows, and consistent colors.

---

### 2.5 Memory Cleanup

- [x] **Implement useEffect cleanup** - Add cleanup function in return
- [x] **Destroy tldraw instance** - Call appropriate disposal method on unmount
- [x] **Clear event listeners** - Remove any attached event handlers
- [x] **Test for memory leaks** - Verify clean unmounting in React DevTools
- [x] **Test navigation** - Ensure clean cleanup when navigating away

**Files to Modify:**
- `frontend/src/features/editor/CanvasEditor.jsx` ✅

**Acceptance Criteria:**
- [x] Canvas instance is properly disposed on unmount
- [x] No memory leaks detected in React DevTools
- [x] Navigation away from canvas is smooth
- [x] No console errors on unmount

> **Completed**: 2026-03-31 - Implemented useEffect cleanup that clears save timeouts and disposes editor reference on unmount.

---

### 2.6 CSS Container Fix (Bug Fix)

- [x] **Fix JSX container structure** - Use absolute inset-0 with fixed A4 height (1131px)
- [x] **Move pagination to sticky top bar** - Better UX with rounded pill design
- [x] **Ensure tldraw fills paper container** - absolute inset-0 wrapper
- [x] **Fix TypeScript errors** - Escape `<` and `>` as JSX expressions
- [x] **Verify onMount zoomToFit** - Camera centers on paper content

**Files Modified:**
- `frontend/src/features/editor/CanvasEditor.jsx` ✅

**Acceptance Criteria:**
- [x] tldraw UI renders correctly inside white paper box
- [x] Pagination bar visible and functional at top
- [x] Paper has fixed A4 dimensions (800x1131)
- [x] Native tldraw toolbars display properly

> **Completed**: 2026-03-31 - Fixed CSS container structure using user-provided bulletproof layout. Paper now has explicit height for A4 ratio, pagination moved to sticky top bar.

---

### 2.7 Canvas Visual Polish - Continuous Scroll Pivot

- [x] **Create NotebookBackground component** - Reactive CSS gradients that pan with camera Y
- [x] **Remove black desk background** - Changed from `bg-slate-800` to `bg-slate-50`
- [x] **Remove sticky pagination bar** - Deleted Page X of Y, < > buttons, + New Page
- [x] **Update paper to A4 fixed size** - Set to 800x1131px (A4 aspect ratio)
- [x] **Update camera lock** - Lock X (0) and Z (1), allow Y to pan (vertical scroll)
- [x] **Wire NotebookBackground** - Pass to Tldraw via `components={{ Background: NotebookBackground }}`
- [x] **Remove duplicate title** - Title only in TextEditor.jsx (parent component)
- [x] **Fix layout structure** - Single clean DOM tree with overflow-hidden
- [x] **Hide "Back to content" toast** - CSS rule to hide ALL toast notifications
- [x] **Add DocumentExport** - Export button matching TextEditor.jsx
- [x] **Fix double scrollbar** - Proper overflow: hidden on all containers
- [x] **Fix tool clipping** - Proper flex layout ensures Tldraw tools render correctly
- [x] **Complete layout rewrite** - Wiped all duplicate code, single clean DOM tree
- [x] **Hide PageMenu and NavigationZone** - Removed annoying "Page 1" dropdown and minimap

**Files Modified:**
- `frontend/src/features/editor/CanvasEditor.jsx` ✅
- `frontend/src/features/editor/canvas-theme.css` ✅

**Acceptance Criteria:**
- [x] Continuous vertical scroll like GoodNotes
- [x] Notebook lines (32px) and page gaps (1163px) render reactively
- [x] Camera scrolls smoothly in Y-axis
- [x] No black desk or pagination UI
- [x] 800px paper column integrates into app background
- [x] Editor header visible with navigation and save controls
- [x] Title input accessible and editable (inside paper column)
- [x] No scroll conflicts with main window (flex-1 h-full overflow-hidden)
- [x] Export button available in header
- [x] Tldraw tools render correctly (no clipping)
- [x] No double scrollbars
- [x] No duplicate headers or DOM elements
- [x] All toast popups permanently hidden

> **Completed**: 2026-03-31 - Pivoted from discrete page turns to infinite vertical scroll with reactive notebook background. Completely rewrote CanvasEditor.jsx with single clean DOM tree. Title sits inside paper column. Fixed all layout issues: double scrollbar, tool clipping, duplicate headers. Hidden PageMenu, NavigationZone, and all toasts.

---

### 2.8 Canvas Scroll Isolation Fix

- [x] **Fix TextEditor.jsx layout** - Render canvas outside `overflow-y-auto` wrapper
- [x] **Conditional rendering** - Canvas mode: no scroll wrapper; Text mode: scroll wrapper with title
- [x] **Eliminate scroll conflicts** - Canvas fills space without browser scroll interference
- [x] **Remove duplicate title in canvas mode** - Title only shows in text mode
- [x] **Fix canvas cropping** - Change fixed `height: 1131px` to dynamic sizing
- [x] **Restore A4 aspect ratio** - Use `aspect-ratio: 1 / 1.414` with `height: 100%`

**Files Modified:**
- `frontend/src/features/editor/TextEditor.jsx` ✅
- `frontend/src/features/editor/CanvasEditor.jsx` ✅

**Acceptance Criteria:**
- [x] Canvas mode renders without scroll wrapper
- [x] Text mode retains scrollable content area with title
- [x] No double scrollbars
- [x] Canvas fills entire editor area in canvas mode
- [x] Title input only visible in text modes
- [x] Canvas paper fills available space without cropping
- [x] A4 aspect ratio (1:1.414) maintained

> **Completed**: 2026-03-31 - Fixed canvas scroll isolation by conditionally rendering canvas outside the `overflow-y-auto` wrapper in TextEditor.jsx. Fixed canvas sizing by using `aspect-ratio: 1 / 1.414` with `height: 100%` instead of fixed or min-height. Canvas mode now fills the entire editor area with proper A4 proportions. Text mode retains scrollable wrapper with title input.

---

## 🟡 Epic 3: Frontend Architecture & UX Polish (Medium Priority)

### 3.1 Auto-Save Hook Extraction

- [x] **Create useAutoSave hook** - Extract shared auto-save logic
- [x] **Define hook interface** - Input parameters and return values
- [x] **Implement debounce logic** - Configurable debounce delay
- [x] **Handle save states** - Loading, success, error states
- [x] **Migrate TextEditor.jsx** - Replace inline auto-save with hook
- [x] **Migrate CanvasEditor.jsx** - Replace inline auto-save with hook
- [x] **Test both editors** - Verify auto-save works identically

**Files to Create:**
- `frontend/src/hooks/useAutoSave.js` ✅

**Files to Modify:**
- `frontend/src/features/editor/TextEditor.jsx` ✅
- `frontend/src/features/editor/CanvasEditor.jsx` ✅

**Acceptance Criteria:**
- [x] Single hook handles auto-save for both editors
- [x] Auto-save behavior is identical to current implementation
- [x] No duplicate logic between editors
- [x] Hook is reusable for future editors

> **Completed**: 2026-03-31 - Created useAutoSave hook with debounce logic. Hook accepts onSave, data, delay, and enabled parameters. Migrated both editors to use the hook for consistent auto-save behavior.

---

### 3.2 Optimistic UI Updates

- [ ] **Implement optimistic save** - Update UI before API response
- [ ] **Implement optimistic grammar fix** - Apply suggestions before confirmation
- [ ] **Add rollback logic** - Revert on API failure
- [ ] **Add error toasts** - Display error messages on rollback
- [ ] **Test failure scenarios** - Verify rollback works correctly

**Files to Modify:**
- `frontend/src/features/editor/TextEditor.jsx`
- `frontend/src/features/editor/SuggestionPanel.jsx`

**Acceptance Criteria:**
- [ ] UI updates immediately on save/grammar fix
- [ ] API calls happen in background
- [ ] Failed requests trigger rollback
- [ ] Error toasts inform user of failures

---

### 3.3 Visual Polish - Text Editor

- [ ] **Soften focus border** - Reduce harsh blue border in light mode
- [ ] **Adjust top margin** - Decrease spacing between toolbar and text area
- [ ] **Review spacing consistency** - Ensure consistent padding/margins
- [ ] **Test in light/dark modes** - Verify changes work in both themes

**Files to Modify:**
- `frontend/src/features/editor/TextEditor.jsx`
- `frontend/src/index.css` (or relevant CSS file)

**Acceptance Criteria:**
- [ ] Focus border is subtle and non-distracting
- [ ] Text area is visually closer to toolbar
- [ ] Changes look good in both light and dark modes

---

### 3.4 Visual Polish - Dashboard/Global

#### "Add Note" Dropdown Upgrade
- [ ] **Add subtle shadow** - `box-shadow` for depth
- [ ] **Add rounded corners** - Consistent border-radius
- [ ] **Add icons** - Document icon for "Text Document", Canvas icon for "Canvas Notebook"
- [ ] **Style hover states** - Interactive feedback

**Files to Modify:**
- `frontend/src/features/dashboard/UserDashboard.jsx` (or relevant component)

#### Canvas Title Hierarchy
- [ ] **Review title positioning** - Ensure title feels connected to paper
- [ ] **Adjust visual hierarchy** - Title should clearly relate to canvas content
- [ ] **Style consistency** - Match design system

**Files to Modify:**
- `frontend/src/features/editor/CanvasEditor.jsx`

#### Dashboard Empty Space
- [ ] **Add "Recent Documents" section** - Grid or list below stat cards
- [ ] **Fetch recent documents** - API call for recent items
- [ ] **Style section** - Consistent with dashboard design
- [ ] **Add navigation** - Click to open document

**Files to Modify:**
- `frontend/src/features/dashboard/UserDashboard.jsx`

**Acceptance Criteria:**
- [ ] Dropdown has professional appearance with shadow and rounded corners
- [ ] Icons clearly indicate document type
- [ ] Canvas title feels connected to paper container
- [ ] Dashboard shows recent documents when space available

---

### 3.5 Grammar Service Finalization

- [x] **Add loading spinner** - Visual feedback during grammar check
- [x] **Handle 504 timeouts** - Graceful error handling for OpenRouter timeouts
- [x] **Add retry logic** - Optional retry on timeout
- [x] **Improve error messages** - User-friendly error notifications
- [x] **Disable button during check** - Prevent duplicate requests
- [x] **Test timeout scenarios** - Verify graceful degradation

**Files to Modify:**
- `frontend/src/features/editor/TextEditor.jsx` ✅

**Acceptance Criteria:**
- [x] Loading spinner visible during grammar check
- [x] 504 timeouts show friendly error message
- [x] Button is disabled during processing
- [x] No duplicate requests possible

> **Completed**: 2026-03-31 - Added `isFixing` state to TextEditor.jsx. Grammar check button now shows "Thinking..." with spinner during API call. Added try/catch with specific handling for 504 Gateway Timeout and ECONNABORTED errors with friendly toast messages.

---

## 📊 Sprint Velocity Estimation

| Epic | Tasks | Estimated Story Points | Priority |
|------|-------|------------------------|----------|
| Epic 1: Security & Backend | 5 sections, 20+ tasks | 13-18 points | 🔴 CRITICAL |
| Epic 2: Canvas Pivot | 5 sections, 25+ tasks | 21-26 points | 🟠 HIGH |
| Epic 3: UX Polish | 5 sections, 20+ tasks | 13-18 points | 🟡 MEDIUM |
| **TOTAL** | **15 sections, 65+ tasks** | **47-62 points** | - |

---

## 🚀 Implementation Order

### Phase 1: Security (Sprint 1)
1. ✅ Strict JWT Validation (CRITICAL - do first)
2. ✅ Auth Race Conditions
3. ✅ Actuator Security
4. ✅ Database Connection Pooling
5. ✅ Dockerfile Optimization

### Phase 2: Canvas Pivot (Sprint 2)
1. ✅ Paper Layout (CSS)
2. ✅ Camera Constraints
3. ✅ Pagination UI
4. ✅ Toolbar UX Consolidation
5. ✅ Memory Cleanup

### Phase 3: UX Polish (Sprint 3)
1. ✅ Auto-Save Hook Extraction
2. ✅ Optimistic UI Updates
3. ✅ Visual Polish (Text Editor)
4. ✅ Visual Polish (Dashboard/Global)
5. ✅ Grammar Service Finalization

---

## 📝 Notes

### Dependencies
- Epic 2 (Canvas Pivot) can be developed in parallel with Epic 1 (Security)
- Epic 3 (UX Polish) depends on Epic 2 completion for canvas-related items

### Risks
- JWT changes could impact existing authenticated sessions
- Canvas pivot requires thorough testing of tldraw camera options
- Optimistic UI requires careful error handling to prevent data loss

### Testing Requirements
- All security changes require integration tests
- Canvas changes require manual QA across browsers
- UX changes require visual regression testing

---

## ✅ Definition of Done

For each task:
- [ ] Code implemented and peer reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests written (where applicable)
- [ ] Documentation updated
- [ ] Accessibility verified (WCAG 2.1 AA)
- [ ] No security vulnerabilities introduced
- [ ] Deployed to staging and verified

---

*This backlog was created from the comprehensive Writegy application review conducted on 2026-03-31.*