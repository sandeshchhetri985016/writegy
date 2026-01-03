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

    // HYBRID APPROACH: Upload file to S3 + save pre-extracted content to DB
    public Document createDocument(MultipartFile file, String title, String content) throws IOException, ExecutionException, InterruptedException {
        User user = getCurrentUser();

        // 1. Upload file to Supabase Storage (only if file is provided)
        String fileName = null;
        if (file != null) {
            fileName = storageService.uploadFile(file);
        }

        // 2. Create document with pre-extracted content (SKIP Tika to save memory!)
        Document document = new Document();
        document.setTitle(title);
        document.setContent(content);  // Content pre-extracted by frontend
        document.setUser(user);

        // 3. Calculate and set word/character counts
        calculateAndSetCounts(document);

        return documentRepository.save(document);
    }

    public List<Document> getDocuments() {
        User user = getCurrentUser();
        List<Document> documents = documentRepository.findByUserId(user.getId());

        System.out.println("DEBUG: Found " + documents.size() + " documents for user: " + user.getEmail());

        // Recalculate word counts for legacy documents (created before word count calculation was added)
        for (Document document : documents) {
            System.out.println("DEBUG: Document '" + document.getTitle() + "' has wordCount: " + document.getWordCount());

            if (document.getWordCount() == null || document.getWordCount() == 0) {
                // Only recalculate if content exists and is not empty
                if (document.getContent() != null && !document.getContent().trim().isEmpty()) {
                    System.out.println("DEBUG: Recalculating word count for document: " + document.getTitle());
                    calculateAndSetCounts(document);
                    documentRepository.save(document);
                    System.out.println("DEBUG: Updated word count to: " + document.getWordCount());
                } else {
                    System.out.println("DEBUG: Skipping document '" + document.getTitle() + "' - no content or empty content");
                }
            }
        }

        return documents;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // For demo purposes, create/use a demo user if not authenticated
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt)) {
            return getOrCreateDemoUser();
        }

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String email = jwt.getClaimAsString("email");

        if (email == null) {
            return getOrCreateDemoUser();
        }

        try {
            return userRepository.findByEmail(email)
                    .orElseGet(() -> createUserFromEmail(email, jwt));
        } catch (Exception e) {
            return getOrCreateDemoUser();
        }
    }

    private User getOrCreateDemoUser() {
        String demoEmail = "demo@example.com";
        return userRepository.findByEmail(demoEmail)
                .orElseGet(() -> createUserFromEmail(demoEmail, null));
    }

    private User createUserFromEmail(String email, Jwt jwt) {
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
        
        // Extract Supabase user ID from JWT if available
        String supabaseId = null;
        if (jwt != null) {
            supabaseId = jwt.getClaimAsString("sub");
        }
        if (supabaseId == null || supabaseId.isEmpty()) {
            supabaseId = "demo-" + email.replace("@", "-");
        }
        
        user.setSupabaseId(supabaseId);
        user.setRole(UserRole.FREE);
        return userRepository.save(user);
    }

    public Document getDocument(Long id) {
        return documentRepository.findById(id).orElseThrow(() -> new RuntimeException("Document not found"));
    }

    public Document updateDocument(Long id, String title, String content) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        document.setTitle(title);
        document.setContent(content);

        // Calculate and set word/character counts
        calculateAndSetCounts(document);

        return documentRepository.save(document);
    }

    public void deleteDocument(Long id) {
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

    private boolean isCircularReference(Long documentId, Long parentId) {
        // Check if the parent is a descendant of the document
        Long currentId = parentId;
        while (currentId != null) {
            if (currentId.equals(documentId)) {
                return true;
            }
            Document current = documentRepository.findById(currentId).orElse(null);
            currentId = current != null ? current.getParent() != null ? current.getParent().getId() : null : null;
        }
        return false;
    }
}
