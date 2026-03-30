# Canvas Asset Cleanup - Approach B (Database Garbage Collection)

## Problem
When images are deleted from the canvas, the files remain in Supabase Storage as "orphaned" files. Over time, this accumulates unused storage.

## Why Frontend Deletion is Dangerous
**Do NOT implement frontend deletion** - it has a critical race condition:

1. User deletes image → auto-save triggers
2. `deleteCanvasAsset()` called (async)
3. User presses Ctrl+Z → image returns to canvas
4. If delete completes after undo → image is in canvas but file is deleted → **broken document**

## Recommended Approach: Database Garbage Collection

### How It Works
A scheduled server-side script that:

1. **Scans all canvas_data** in PostgreSQL database
2. **Creates a master list** of all active image URLs
3. **Compares** to actual files in Supabase bucket
4. **Deletes** any file that:
   - Is older than 24 hours AND
   - Doesn't exist in the database list

### Implementation Plan

#### 1. Create a Scheduled Job (Backend)
```java
// CanvasAssetCleanupService.java
@Service
public class CanvasAssetCleanupService {
    
    @Scheduled(cron = "0 0 3 * * ?") // Run daily at 3 AM
    public void cleanupOrphanedAssets() {
        // 1. Get all canvas_data from documents table
        // 2. Extract all Supabase image URLs using regex
        // 3. List all files in Supabase bucket
        // 4. Find files not in database AND older than 24 hours
        // 5. Delete orphaned files
    }
}
```

#### 2. Enable Scheduling in Spring Boot
```java
@SpringBootApplication
@EnableScheduling
public class WritegyApplication {
    // ...
}
```

#### 3. Supabase Storage API Integration
```java
// Use Supabase Java client to list and delete files
// List files: GET /storage/v1/object/list/{bucket}
// Delete file: DELETE /storage/v1/object/{bucket}/{path}
```

### Safety Features
- **24-hour grace period**: Won't delete files uploaded in the last 24 hours
- **Database verification**: Only deletes files not referenced in any document
- **Logging**: Logs all deletions for audit trail
- **Dry run mode**: Test without actually deleting

### When to Implement
- When Supabase storage usage approaches 80% of free tier (800MB)
- When you have automated backups in place
- When you're ready for production deployment

### Current Status
- ✅ Image upload working
- ✅ Canvas save/load working
- ⚠️ Orphaned files accumulate (safe for now)
- 📋 Cleanup approach documented for future

## Storage Estimates
- Free tier: 1GB
- Average image: 2-5MB
- Estimated capacity: 200-500 images before cleanup needed
- Time to reach limit: Months of normal use

## References
- Supabase Storage API: https://supabase.com/docs/reference/javascript/storage-from-list
- Spring Scheduling: https://spring.io/guides/gs/scheduling-tasks/