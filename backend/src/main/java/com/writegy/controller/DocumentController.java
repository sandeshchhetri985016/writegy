package com.writegy.controller;

import com.writegy.dto.DocumentDTO;
import com.writegy.dto.DocumentRequest;
import com.writegy.model.entity.Document;
import com.writegy.service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentDTO> createDocument(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("content") String content) throws IOException, ExecutionException, InterruptedException {

        // Validate file (keep security) - only if file is provided
        if (file != null) {
            validateFile(file);
        }

        // Create document with pre-extracted content (hybrid approach)
        Document document = documentService.createDocument(file, title, content);
        DocumentDTO dto = mapToDTO(document);
        return ResponseEntity.ok(dto);
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
    public ResponseEntity<List<DocumentDTO>> getAllDocuments() {
        List<Document> documents = documentService.getDocuments();
        List<DocumentDTO> dtos = documents.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentDTO> getDocumentById(@PathVariable Long id) {
        Document document = documentService.getDocument(id);
        DocumentDTO dto = mapToDTO(document);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DocumentDTO> updateDocument(@PathVariable Long id, @RequestBody DocumentRequest request) {
        Document updatedDocument = documentService.updateDocument(id, request.getTitle(), request.getContent());
        DocumentDTO dto = mapToDTO(updatedDocument);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    // Tree Hierarchy Endpoints

    @GetMapping("/tree")
    public ResponseEntity<List<Document>> getDocumentTree() {
        List<Document> tree = documentService.getDocumentTree();
        return ResponseEntity.ok(tree);
    }

    @PostMapping("/{id}/parent")
    public ResponseEntity<Document> setParent(@PathVariable Long id, @RequestParam Long parentId) {
        Document document = documentService.setDocumentParent(id, parentId);
        return ResponseEntity.ok(document);
    }

    @DeleteMapping("/{id}/parent")
    public ResponseEntity<Document> removeParent(@PathVariable Long id) {
        Document document = documentService.removeDocumentParent(id);
        return ResponseEntity.ok(document);
    }

    @GetMapping("/{id}/children")
    public ResponseEntity<List<Document>> getChildren(@PathVariable Long id) {
        List<Document> children = documentService.getDocumentChildren(id);
        return ResponseEntity.ok(children);
    }

    private DocumentDTO mapToDTO(Document document) {
        if (document == null) return null;

        DocumentDTO dto = new DocumentDTO();
        dto.setId(document.getId());
        dto.setTitle(document.getTitle());
        dto.setContent(document.getContent());
        dto.setStatus(document.getStatus());
        dto.setWordCount(document.getWordCount());
        dto.setCharacterCount(document.getCharacterCount());
        dto.setCreatedAt(document.getCreatedAt());
        dto.setUpdatedAt(document.getUpdatedAt());
        dto.setDeletedAt(document.getDeletedAt());

        // Hierarchy fields
        dto.setParentId(document.getParent() != null ? document.getParent().getId() : null);
        dto.setDepth(document.getDepth());
        dto.setTreeOrder(document.getTreeOrder());

        // Include user info without circular reference
        dto.setUserId(document.getUser() != null ? document.getUser().getId() : null);
        dto.setUserEmail(document.getUser() != null ? document.getUser().getEmail() : null);
        dto.setUserName(document.getUser() != null ? document.getUser().getName() : null);

        return dto;
    }
}
