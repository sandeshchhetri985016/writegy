package com.writegy.service;

import com.writegy.model.entity.Document;
import com.writegy.model.entity.User;
import com.writegy.model.enums.UserRole;
import com.writegy.repository.DocumentRepository;
import com.writegy.repository.UserRepository;
import org.springframework.security.oauth2.jwt.Jwt;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StorageService storageService; // Keep S3 upload learning

    @Autowired
    private TextExtractionService textExtractionService; // SEC-001: Server-side extraction

    // Helper method to calculate word and character counts
    private void calculateAndSetCounts(Document document) {
        String content = document.getContent();
        if (content != null && !content.trim().isEmpty()) {
            // Count words (split by whitespace and filter out empty strings)
            String[] words = content.trim().split("\\s+");
            int wordCount = words.length;

            // Count characters (excluding whitespace for readability stats)
            int charCount = content.replaceAll("\\s", "").length();

            document.setWordCount(wordCount);
            document.setCharacterCount(charCount);
        } else {
            document.setWordCount(0);
            document.setCharacterCount(0);
        }
    }

    /**
     * SEC-001 FIX: Server-side text extraction.
     * Extracts text from uploaded file instead of trusting client-provided content.
     * Supports PDF (via Apache PDFBox) and DOCX (via Apache POI).
     */
    public Document createDocument(MultipartFile file, String title) throws IOException, ExecutionException, InterruptedException {
        User user = getCurrentUser();

        // 1. Upload file to Supabase Storage (only if file is provided)
        String fileName = null;
        if (file != null && !file.isEmpty()) {
            fileName = storageService.uploadFile(file);
        }

        try {
            // 2. SEC-001: Extract text server-side from uploaded file
            String extractedContent = "";
            if (file != null && !file.isEmpty()) {
                extractedContent = textExtractionService.extractText(file);
                
                // Validate content length against file size for sanity check
                if (!textExtractionService.validateContentLength(extractedContent, file.getSize())) {
                    throw new IOException("Extracted content length exceeds expected bounds for file size");
                }
            }

            // 3. Create document with server-side extracted content
            Document document = new Document();
            document.setTitle(title);
            document.setContent(extractedContent);
            document.setUser(user);

            // 4. Calculate and set word/character counts
            calculateAndSetCounts(document);

            return documentRepository.save(document);
        } catch (Exception e) {
            // ARCH-006: Compensating transaction - clean up orphaned S3 file
            if (fileName != null) {
                try {
                    storageService.deleteFile(fileName);
                } catch (Exception deleteException) {
                    // Log but don't fail - file will be cleaned up by lifecycle policy
                    System.err.println("Failed to delete orphaned S3 file: " + fileName);
                }
            }
            throw e;
        }
    }

    /**
     * Create document with plain text content (no file upload).
     * Used for direct text input without file attachment.
     */
    public Document createDocument(String title, String content) throws IOException {
        User user = getCurrentUser();

        Document document = new Document();
        document.setTitle(title);
        document.setContent(content);
        document.setUser(user);

        // Calculate and set word/character counts
        calculateAndSetCounts(document);

        return documentRepository.save(document);
    }

    public List<Document> getDocuments() {
        User user = getCurrentUser();
        List<Document> documents = documentRepository.findByUserId(user.getId());

        // PERF-001 FIX: Removed word count recalculation from GET request
        // Word counts are now backfilled via V10 migration and calculated on create/update
        
        return documents;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null) {
            throw new RuntimeException("Authentication required");
        }

        String email = null;
        Jwt jwt = null;

        // Handle both Jwt principal and UserDetails principal
        if (authentication.getPrincipal() instanceof Jwt) {
            jwt = (Jwt) authentication.getPrincipal();
            email = jwt.getClaimAsString("email");
        } else if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
            // In dev mode, we set UserDetails as principal
            org.springframework.security.core.userdetails.UserDetails userDetails = 
                (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal();
            email = userDetails.getUsername();
        } else {
            throw new RuntimeException("Invalid authentication principal");
        }

        if (email == null) {
            throw new RuntimeException("Invalid JWT token: email claim missing");
        }

        final String finalEmail = email;
        final Jwt finalJwt = jwt;

        return userRepository.findByEmail(finalEmail)
                .orElseGet(() -> createUserFromEmail(finalEmail, finalJwt));
    }

    private User createUserFromEmail(String email, Jwt jwt) {
        // Extract Supabase user ID from JWT if available
        String supabaseId = null;
        if (jwt != null) {
            supabaseId = jwt.getClaimAsString("sub");
        }
        if (supabaseId == null || supabaseId.isEmpty()) {
            supabaseId = "demo-" + email.replace("@", "-");
        }
        
        // Check if user already exists by email
        java.util.Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // Update supabaseId if it's different
            if (!supabaseId.equals(user.getSupabaseId())) {
                user.setSupabaseId(supabaseId);
                return userRepository.save(user);
            }
            return user;
        }
        
        // Create new user
        User user = new User();
        user.setEmail(email);
        
        // Extract name from JWT if available, otherwise use email prefix
        String name = null;
        if (jwt != null) {
            name = jwt.getClaimAsString("full_name");
        }
        if (name == null || name.isEmpty()) {
            name = email.split("@")[0];
        }
        
        user.setName(name);
        user.setSupabaseId(supabaseId);
        user.setRole(UserRole.FREE);
        return userRepository.save(user);
    }

    public Document getDocument(Long id) {
        User currentUser = getCurrentUser();
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        // Verify ownership
        if (!document.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized to access this document");
        }

        return document;
    }

    public Document updateDocument(Long id, String title, String content) {
        User currentUser = getCurrentUser();
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        // Verify ownership
        if (!document.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized to update this document");
        }

        document.setTitle(title);
        document.setContent(content);

        // Calculate and set word/character counts
        calculateAndSetCounts(document);

        return documentRepository.save(document);
    }

    public void deleteDocument(Long id) {
        User currentUser = getCurrentUser();
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        // Verify ownership
        if (!document.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized to delete this document");
        }

        documentRepository.deleteById(id);
    }

    // Tree Hierarchy Methods

    public List<Document> getDocumentTree() {
        User user = getCurrentUser();
        return documentRepository.findAllByUserIdOrderByHierarchy(user.getId());
    }

    public Document setDocumentParent(Long documentId, Long parentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        Document parent = documentRepository.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Parent document not found"));

        // Prevent circular references
        if (isCircularReference(documentId, parentId)) {
            throw new RuntimeException("Cannot create circular reference");
        }

        document.setParent(parent);
        document.setDepth(parent.getDepth() + 1);

        return documentRepository.save(document);
    }

    public Document removeDocumentParent(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        document.setParent(null);
        document.setDepth(0);

        return documentRepository.save(document);
    }

    public List<Document> getDocumentChildren(Long parentId) {
        return documentRepository.findByParentIdOrderByTreeOrderAsc(parentId);
    }

    /**
     * PERF-002 FIX: Use recursive CTE query for single database round-trip.
     * Checks if documentId is an ancestor of parentId (would create circular reference).
     */
    private boolean isCircularReference(Long documentId, Long parentId) {
        // Check if the document is an ancestor of the parent
        // If true, setting parent would create a circular reference
        return documentRepository.isAncestorOf(documentId, parentId);
    }
}
