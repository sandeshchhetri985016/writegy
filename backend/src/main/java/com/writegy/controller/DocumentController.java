package com.writegy.controller;

import com.writegy.model.Document;
import com.writegy.service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Document> createDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("content") String content) throws IOException, ExecutionException, InterruptedException {

        // Validate file (keep security)
        validateFile(file);

        // Create document with pre-extracted content (hybrid approach)
        Document document = documentService.createDocument(file, title, content);
        return ResponseEntity.ok(document);
    }

    private void validateFile(MultipartFile file) {
        // Check if file is empty
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        // Check file size (5MB limit for 512MB free tier safety)
        long maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size of 5MB for free tier compatibility");
        }

        // Check file type (allow common document formats for free tier)
        String contentType = file.getContentType();
        List<String> allowedTypes = Arrays.asList(
            "application/pdf",           // PDF
            "application/msword",       // DOC
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // DOCX
        );

        if (contentType == null || !allowedTypes.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("File type not supported. Only PDF and DOC/DOCX files are allowed.");
        }

        // Additional security: check file extension as backup
        String filename = file.getOriginalFilename();
        if (filename != null) {
            String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
            List<String> allowedExtensions = Arrays.asList("pdf", "doc", "docx");
            if (!allowedExtensions.contains(extension)) {
                throw new IllegalArgumentException("File extension not supported. Only .pdf, .doc, and .docx files are allowed.");
            }
        }
    }

    @GetMapping
    public ResponseEntity<List<Document>> getAllDocuments() {
        List<Document> documents = documentService.getDocuments();
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Document> getDocumentById(@PathVariable Long id) {
        Document document = documentService.getDocument(id);
        return ResponseEntity.ok(document);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
}
