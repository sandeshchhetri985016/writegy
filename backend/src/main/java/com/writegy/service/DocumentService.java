package com.writegy.service;

import com.writegy.model.Document;
import com.writegy.model.User;
import com.writegy.repository.DocumentRepository;
import com.writegy.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StorageService storageService; // Keep S3 upload learning

    // HYBRID APPROACH: Upload file to S3 + save pre-extracted content to DB
    public Document createDocument(MultipartFile file, String title, String content) throws IOException {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(username).orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Upload file to Cloudflare R2 (keep this learning experience!)
        String fileName = storageService.uploadFile(file);

        // 2. Create document with pre-extracted content (SKIP Tika to save memory!)
        Document document = new Document();
        document.setTitle(title);
        document.setContent(content);  // Content pre-extracted by frontend
        document.setUser(user);
        document.setCreatedAt(LocalDateTime.now());

        return documentRepository.save(document);
    }

    public List<Document> getDocuments() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(username).orElseThrow(() -> new RuntimeException("User not found"));
        return documentRepository.findByUserId(user.getId());
    }

    public Document getDocument(Long id) {
        return documentRepository.findById(id).orElseThrow(() -> new RuntimeException("Document not found"));
    }

    public void deleteDocument(Long id) {
        documentRepository.deleteById(id);
    }
}
