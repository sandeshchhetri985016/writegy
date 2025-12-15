package com.writegy.service;

import com.writegy.model.entity.Document;
import com.writegy.model.entity.User;
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

    // HYBRID APPROACH: Upload file to S3 + save pre-extracted content to DB
    public Document createDocument(MultipartFile file, String title, String content) throws IOException, ExecutionException, InterruptedException {
        User user = getCurrentUser();

        // 1. Upload file to Supabase Storage
        String fileName = storageService.uploadFile(file);

        // 2. Create document with pre-extracted content (SKIP Tika to save memory!)
        Document document = new Document();
        document.setTitle(title);
        document.setContent(content);  // Content pre-extracted by frontend
        document.setUser(user);

        return documentRepository.save(document);
    }

    public List<Document> getDocuments() {
        User user = getCurrentUser();
        return documentRepository.findByUserId(user.getId());
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt)) {
            throw new IllegalArgumentException("Invalid authentication - JWT required");
        }

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String email = jwt.getClaimAsString("email");

        if (email == null) {
            throw new IllegalArgumentException("Email claim missing from JWT");
        }

        try {
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        } catch (Exception e) {
            throw new RuntimeException("Error finding user", e);
        }
    }

    public Document getDocument(Long id) {
        return documentRepository.findById(id).orElseThrow(() -> new RuntimeException("Document not found"));
    }

    public void deleteDocument(Long id) {
        documentRepository.deleteById(id);
    }
}
